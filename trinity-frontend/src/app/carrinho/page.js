"use client";

import { useContext } from "react";
import AuthContext from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import toast from "react-hot-toast";

export default function CarrinhoPage() {
  const {
    cart,
    removeFromCart,
    clearCart,
  } = useCart();

  const { token } = useContext(AuthContext);

  const total = cart.reduce((acc, item) => {
    return acc + Number(item.product.price) * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    try {
      if (!token) {
        toast.error("Você precisa estar logado para finalizar a compra.");
        return;
      }

      // Criar pedido
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            total,
            items: cart.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
            })),
          }),
        }
      );

      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        toast.error(order.message || "Erro ao criar pedido.");
        return;
      }

      // Criar preferência Mercado Pago
      const paymentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/create-preference`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            items: cart.map((item) => ({
              id: item.product.id,
              title: item.product.name,
              quantity: item.quantity,
              unit_price: Number(item.product.price),
            })),
          }),
        }
      );

      const payment = await paymentResponse.json();

      if (!paymentResponse.ok) {
        toast.error(payment.message || "Erro ao iniciar pagamento.");
        return;
      }

      toast.success("Redirecionando para o pagamento...");

      clearCart();

      setTimeout(() => {
        window.location.href = payment.init_point;
      }, 800);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar ao servidor.");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">

        <h1 className="mb-10 text-4xl font-black">
          Seu Carrinho
        </h1>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <p className="text-lg text-zinc-400">
              Seu carrinho está vazio 🛒
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {cart.map((item) => (
              <div
                key={`${item.product.id}-${item.variation?.id}`}
                className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600 md:flex-row md:items-center"
              >

                <Image
                  src={
                    item.product.images?.find((img) => img.isMain)?.imageUrl ||
                    item.product.images?.[0]?.imageUrl ||
                    "/produtos/frente.jpg.jpeg"
                  }
                  alt={item.product.name}
                  width={120}
                  height={120}
                  className="rounded-xl object-cover"
                />

                <div className="flex-1">

                  <h2 className="text-xl font-bold">
                    {item.product.name}
                  </h2>

                  {item.variation && (
                    <p className="mt-2 text-zinc-400">
                      {item.variation.size} • {item.variation.color}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-zinc-500">
                    Quantidade: {item.quantity}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-2xl font-bold">
                    R$ {(Number(item.product.price) * item.quantity)
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>

                  <button
                    onClick={() =>
                      removeFromCart(
                        item.product.id,
                        item.variation?.id
                      )
                    }
                    className="mt-4 rounded-xl bg-red-600 px-5 py-2 font-semibold transition hover:bg-red-700"
                  >
                    Remover
                  </button>

                </div>

              </div>
            ))}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">

              <h2 className="mb-6 text-2xl font-bold">
                Resumo do Pedido
              </h2>

              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>

              <div className="mt-3 flex justify-between text-zinc-400">
                <span>Frete</span>
                <span>Grátis</span>
              </div>

              <div className="my-6 border-t border-zinc-800" />

              <div className="flex justify-between text-2xl font-black">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-8 w-full rounded-2xl bg-white py-4 text-lg font-bold text-black transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-200"
              >
                Finalizar Compra
              </button>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}