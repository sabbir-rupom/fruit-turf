<h1>Thank you, {{ $order->buyer_name }}.</h1>
<p>Your Fruit Turf order {{ $order->invoice_number }} is confirmed.</p>
<p>Order total: {{ $order->currency }} {{ number_format((float) $order->total, 2) }}</p>
<p>We will deliver to: {{ $order->delivery_address }}</p>
