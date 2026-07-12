const prisma = require("../config/prisma");


const createOrder = async (req,res)=>{
try {
const {
items,
total
}=req.body;
if(!items || items.length === 0){
return res.status(400).json({
message:"Pedido vazio"
});
}
const order = await prisma.order.create({
data:{
userId:req.user.id,
total:Number(total),
items:{
create:items.map(item=>({
productId:item.productId,
productName:item.productName,
quantity:item.quantity,
unitPrice:Number(item.unitPrice)
}))
}
},
include:{
items:true
}
});
res.json(order);
}catch(error){
console.log(error);
res.status(500).json({
message:"Erro ao criar pedido"
});
}

};





const getMyOrders = async(req,res)=>{

try{


const orders = await prisma.order.findMany({

where:{
userId:req.user.id
},

include:{
items:true
},

orderBy:{
createdAt:"desc"
}

});


res.json(orders);


}catch(error){

res.status(500).json({
message:"Erro ao buscar pedidos"
});

}

};
module.exports={
createOrder,
getMyOrders
}; 