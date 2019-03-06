// Test server app for the JK Javascript Framework.
//
// This app manages a database of "orders", each of
// which contains a number of "items". It presents
// a JSON API by which clients can add and edit orders.
// The editing of individual items in an order is
// handled through data-bound tables in the client
// using the JK framework.

// Dependencies.
let express = require("express");
let bodyParser = require("body-parser");
let app = express();

// Express setup.
app.use(express.static("public"));
app.use(bodyParser.json());

// The "persistent database" of orders.
let orders = [
		{
			order_id: 42,
			items: [
				{
					item_id: 1,
					name: "food",
					quantity: 1,
					price: 254
				},
				{
					item_id: 2,
					name: "drink",
					quantity: 2,
					price: 2250
				}
			]
		}
];

// Monotonically-increasing order ID.
let next_order_id = 43;

// Prices for each item.
let item_prices = {
	food: 500,
	drink: 100,
	toy: 650,
	book: 799,
	pet_food: 850,
	flowers: 400,
	cup: 300,
	saucer: 350
}

// Locate an order in the database.
function findOrder(order_id) {
	let ii = 0;
	for (ii=0; ii<orders.length; ++ii) {
		if (orders[ii].order_id == order_id) {
			return orders[ii];
		}
	}
	return { error_msg: "No order with ID "+order_id };
}

// Get the price of the item with the given name.
function getItemPrice(item) {
	if (item in item_prices) {
		return item_prices[item];
	} else {
		return 100;
	}
}

// Return all items and their prices.
app.get("/items", (req,rsp,next) => {
	rsp.json(item_prices);
});

// Create a new, empty order.
app.post("/newOrder", (req,rsp,next) => {
	let order_id = next_order_id++;
	let order = {
		order_id: order_id,
		items: []
	};
	orders.push(order);
	rsp.json(order);
});

// Return all info about an order and its contents.
app.get("/getOrder", (req,rsp,next) => {
	rsp.json(
		findOrder(req.query.order_id)
	);
});

// Add a new, unspecified item to an order.
// The query contains the order_id.
app.post("/addItem", (req,rsp,next) => {
	let order = findOrder(req.body.order_id);
	if (!("error_msg" in order)) {
		let item = {
			name: "(Click to select)",
			quantity: 1,
			price: 0
		};
		order.items.push(item);
	}
	rsp.json(order);
});

// Edit the name or quantity of an order item.
//
// This implements the server API required by the JK framework.
// The UI sends item_id="order_id+item_index", and
// either a name or quantity value to set in the
// indicated item. The server must perform the appropriate
// data update and then return the complete order in
// JSON format to the client. On the client side,
// the configured renderer function must be able to
// render the returned JSON as HTML, with all of the
// attributes the JK framework requires (as documented in
// public/spa.html).
app.put("/editItem", (req,rsp,next) => {
	console.log("PUT /editItem: "+JSON.stringify(req.body));
	let order_and_item = req.body.item_id.split("+"); // "order_id+item_index"
	let order_id = parseInt(order_and_item[0]);
	let item_idx = parseInt(order_and_item[1]);
	let order = findOrder(order_id);
	let result = order;
	if (!("error_msg" in order)) {
		if (item_idx < order.items.length) {
			// Edit
			item = order.items[item_idx];
			if ("name" in req.body) {
				item.name = req.body.name;
			}
			if ("quantity" in req.body) {
				quantity = parseInt(req.body.quantity);
				if (quantity === 0) {
					order.items.splice(item_idx,1);
					item = null;
				} else {
					item.quantity = quantity;
				}
			}
			if (item != null) {
				item.price = item.quantity * getItemPrice(item.name);
			}
		} else {
			result = {error_msg:"No such item in order"};
		}
	}
	rsp.json(result);
});

// Remove an item from an order.
// The query contains the order_id and the item_idx
// as separate arguments.
app.delete("/removeItem", (req,rsp,next) => {
	console.log("Trying to DELETE "+req.body.order_id+"+"+req.body.item_idx);
	let order = findOrder(parseInt(req.body.order_id));
	let result = {error_msg: "No such item "+req.body.order_id+"+"+req.body.item_idx};
	if (!("error_msg" in order)) {
		let item_idx = parseInt(req.body.item_idx);
		if (!("error_msg" in order)) {
			order.items.splice(item_idx,1);
		}
		result = order;
	}
	rsp.json(result);
});

// Start the app.
app.listen(3000, () => {
	console.log("Express server listening on port 3000.");
});

