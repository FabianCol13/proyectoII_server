'use strict';
const stripe = require("stripe")("abbbc800ba5701fc0e1064b13c03038c568b1df715b629ea8535e32fe2073e1a");

function calDiscountPrice(price, discount){
    if(!discount) return price;

    const discountAmount = (price * discount)/100;
    const result = price - discountAmount;

    return result.toFixed(2);
}

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({strapi}) =>({
    async paymentOrder( ctx) {
        //ctx.body = 'Pago generado';
        const {token, products,idUser,addressShipping} = ctx.request.body;
        let totalPayment = 0;
        products.forEach((product) => {
            const priceTemp = calDiscountPrice(
                product.attributes.price,
                product.attributes.discount,
            );
            totalPayment +=Number(priceTemp) * product.quantity;
        });

        const charge = await stripe.charges.create({
            amount: Math.round(totalPayment * 100),
            currency : "COP",
            source : token.id,
            description : `User ID : ${idUser}`
        });
        
        const data = {
            products,
            user: idUser,
            totalPayment,
            idPayment: charge.id,
            addressShipping,
        };

        const model = strapi.contentTypes["api::order.order"];
        const validData = await strapi.entityValidator.validateEntityCreation
        (
            model,
            data
        );

        const entry = await strapi.db
        .query("api::oder.order")
        .create({data : validData})

        return entry;
    },
}));
