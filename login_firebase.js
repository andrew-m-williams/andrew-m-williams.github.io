// Sign up new users 
function handleSignUp()
{
	// Check for valid user input
	var email = document.getElementById('signUpEmail').value;
	var password = document.getElementById('signUpPassword').value;
	var firstName = document.getElementById('firstName').value;
	var lastName = document.getElementById('lastName').value;
	var userName = firstName + ' ' + lastName;
	if (email.length < 4) {
		alert('Please enter a valid email address.')
		return;
	}
	if (password.length < 4) {
		alert('Please enter a valid password.')
		return;
	}

	// Sign in with email and password
	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
		// Handle any errors
		var errorCode = error.code;
		var errorMessage = error.message;

		// Handle weak passwords
		if (errorCode == 'auth/weak-password')	{
			alert('Password is too weak. Please enter a stronger password');
		} else {
			alert(errorMessage);
		}
		console.log(error);
	});

	// Update the user's display name using first and last name and set the html field
	firebase.auth().onAuthStateChanged(function(user) {
  		if (user) {
			user.updateProfile({
				displayName: userName
			}).then(function() {
				document.getElementById('displayNameField').textContent = user.displayName;
			}, function(error) {
				// error occurred, handle it
			});
		} else {
			// Shouldn't get here, already authenticated above
		}
	});
}

// Sign in existing users
function handleSignIn()
{
	if (firebase.auth().currentUser) {
		firebase.auth().signOut();
	} else {
		var email = document.getElementById('loginEmail').value
		var password = document.getElementById('loginPassword').value

		if (email.length < 4) {
			alert('Please enter a valid email address.')
			return;
		}
		if (password.length < 4) {
			alert('Please enter a valid password.')
			return;
		}

		// Sign in the user with email and password
		firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
			// Handle any errors
			var errorCode = error.code;
			var errorMessage = error.message;
			if (errorCode === 'auth/wrong-password') {
				alert('Wrong password.');
			} else {
				alert(errorMessage);
			}
			console.log(error);
		});
	}
}


function handleSignOut()
{
	firebase.auth().signOut().then(function() {
		console.log('Successfully signed out.');
	}, function(error) {
		console.error('Sign out error occurred.', error);
	});
}

function validatePromoCode()
{
	var codeString = document.getElementById('promo-entry-box').value;
	var promoMessage = document.getElementById('promo-message');

	// Check database for valid promo code to match coupon
	const db = firebase.firestore();
	var matchFound = false;
	db.collection("promo-codes").get().then(function(querySnapshot) {
		querySnapshot.forEach(function(doc) {
			if (isValidPromoCode(doc, codeString)) {
				matchFound = true;
				applyPromoCode(doc.data().discount); // Get the discount factor from the database and applies
				promoMessage.textContent = '"' + codeString + '"' + ' promo code applied successfully!';
				promoMessage.style.color = "lightgreen";
			}
		});

		if (matchFound) {
			return;
		} else {
			// Display error message to user, code not valid
			promoMessage.textContent = '"' + codeString + '"' + ' not a valid promo code.';
			promoMessage.style.color = "red";
		}
	});
}

function isValidPromoCode(doc, codeString)
{
	return (codeString.toUpperCase() == doc.data().value);
}

function applyPromoCode(discount)
{
	// Take the promo code's discount factor and update the price total
	var oldPrice = Number(document.getElementById('total-price-value').textContent);
	var newPrice = oldPrice - oldPrice*discount;

	// Update the price and API
	updateTotals(newPrice, 'usd');
}

// Function to show main page
function displayMainForm(currentUser)
{
	// Hide the login screen
	document.getElementById('loginForm').style.display = "none";

	// Show the main page html elements
	document.getElementById('mainForm').style.display = "block";

	// Ensure the user's name is displayed correctly
	document.getElementById('displayNameField').textContent = currentUser.displayName;

	// Display the products
	var product_container= document.getElementById('product_container');
	getProducts(product_container);
}

// Function to show login page
function displayLoginForm()
{
	// Hide the main screen
	document.getElementById('mainForm').style.display = "none";

	// Show the login page html elements
	document.getElementById('loginForm').style.display = "block";
}

function initApp()
{
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			// User is signed in
			displayMainForm(user);
		} else {
			// User is signed out or unregistered
			displayLoginForm();
		}
	});
}

function renderProduct(doc, grid_container)
{
	// TO DO: Insert class attributes for styling
	// Create the html forms with the image, name, and price
	let div = document.createElement('div');
	let canvas = document.createElement('canvas');
	let image = document.createElement('img');
	let br = document.createElement('br');
	let br2 = document.createElement('br');
	let name = document.createElement('span');
	let price = document.createElement('span');
	let quantity = document.createElement('input');
	let add = document.createElement('button');
	let remove = document.createElement('button');

	// Set the class attributes for styling
	div.setAttribute('data-id', doc.id);
	div.setAttribute('class', "grid-item");
	price.setAttribute('class', "price-value");
	quantity.setAttribute('class', "quantity-box");
	add.setAttribute('class', "add-button");
	remove.setAttribute('class', "remove-button");

	image.src = doc.data().image_ref;
	name.textContent = doc.data().name + ': ';
	price.textContent = doc.data().price_usd.toFixed(2); // Set the price to show two decimals if rounded nicely
	quantity.value = 0.00;
	add.textContent = '+';
	remove.textContent = '-';
	add.setAttribute('onclick', "increaseQuantity(this)");
	remove.setAttribute('onclick', "decreaseQuantity(this)");

	// Render the image onto the canvas
	image.onload = function() {
		canvas.width = 132;
		canvas.height = 150;
		canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
	}

	// Append the name, price, and canvas image to html table
	div.appendChild(canvas);
	div.appendChild(br);
	div.appendChild(name);
	div.appendChild(price);
	div.appendChild(br2);
	div.appendChild(quantity);
	div.appendChild(remove);
	div.appendChild(add);

	grid_container.appendChild(div);

}

function getProducts(grid_container)
{
	const db = firebase.firestore();
	db.collection("products").get().then(function(querySnapshot) {
		querySnapshot.forEach(function(doc) {
			renderProduct(doc, grid_container);
		});
	});
}

function getQuantityBox(trigger_button) 
{
	// Returns the first element with class 'quantity' box in the parent div
	// Should only be one quantity box, html is dynamically generated in renderProduct()
	return trigger_button.parentElement.querySelector('.quantity-box');
}

function increaseQuantity(trigger_button)
{
	var quantity_box = getQuantityBox(trigger_button);
	quantity_box.value = Number(quantity_box.value) + 1;
}

function decreaseQuantity(trigger_button)
{
	var quantity_box = getQuantityBox(trigger_button);
	quantity_box.value =  Number(quantity_box.value) - 1;
	if (quantity_box.value < 0) {
		quantity_box.value = 0.00;
	}
}


function checkoutItems()
{
	var priceTotal = 0;
	var quantityBoxes = document.getElementsByClassName("quantity-box");
	var priceValues = document.getElementsByClassName("price-value");

	// Total quantity is all items in the quantity boxes

	// Total price is quantity of the item multiplied by its price
	for (var i = 0; i < priceValues.length; i++) {
		priceTotal += Number(priceValues[i].textContent)*quantityBoxes[i].value;
	}

	// Update the price and API
	updateTotals(priceTotal, 'usd');
}

function updateTotals(price, currency)
{
	// Update the total price in html
	document.getElementById('total-price-value').textContent =  price;

	// Send the total price to Brainblocks API
	updateBrainblocksPrice(price, currency);
}

function updateBrainblocksPrice(price, currency)
{
	// May add currency coversions here

	// If existing button is there, remove it.
	document.getElementById('nano-button').innerHTML = "";

	// Rerender the button
	renderBrainblocks(price, currency);
}

function renderBrainblocks(price, currency)
{
    // Render the Nano button
    brainblocks.Button.render({

        // Pass in payment options
        payment: {
            destination: 'xrb_3rndbrwsycws3x3hdr4p48hf55s6zgco4xaxgjcsrmdy8ijonew1i6s5miig',
            currency:    currency,
            amount:      price
        },

        // Handle successful payments
        onPayment: function(data) {
            console.log('Payment successful!', data.token);
        }

    }, '#nano-button');
}

function setTwoNumberDecimal(event) {
    this.value = parseFloat(this.value).toFixed(2);
}