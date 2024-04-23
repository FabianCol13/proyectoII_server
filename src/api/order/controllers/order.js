'use strict';
const stripe = require("stripe")("ebd3643f3ed5b5f94d1c6cefe35956990182e87259d04125206f8649b834bd3e663bb47a5b07f3d850b3c893cbcb3d63d1810eb7f624ff577454dfbaf015a650e05fd42b6846c82949c1667be768a088637678e43c31cd14e526d3a8ed59113a2eec6500d3283b66f80f8a1b83ae35fc55a948a5efc4ab7e03db32f48a6b4246");

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
