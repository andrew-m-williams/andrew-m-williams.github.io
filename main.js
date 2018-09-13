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

function handleShipping()
{
	// Check for valid user input
	var firstName = document.getElementById('checkout-firstName').value;
	var lastName = document.getElementById('checkout-lastName').value;
	var address1 = document.getElementById('address-line1').value;
	var address2 = document.getElementById('address-line2').value;
	var city = document.getElementById('city-line').value;
	var state = document.getElementById('state-line').value;
	var zip = document.getElementById('zip-line').value;
	
	if (firstName.length <= 0) {
		alert('Please enter a valid first name.')
		return;
	}
	if (lastName.length <= 0) {
		alert('Please enter a valid last name.')
		return;
	}
	if (address1.length <= 0) {
		alert('Please enter a valid address.')
		return;
	}
	if (city.length <= 0) {
		alert('Please enter a valid city.')
		return;
	}
	if (state.length <= 0) {
		alert('Please enter a valid state.')
		return;
	}
	if (zip.length <= 0) {
		alert('Please enter a valid zip.')
		return;
	}					

	// TODO: Improve error checking by verifying address and supplying user with valid address
	
	displayPaymentForm();
}

function handlePurchase()
{

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
			if (promoCodeExists(doc, codeString)) {
				matchFound = true;
				if (isValidPromoCode(doc)) {
					applyPromoCode(doc); // Get the discount factor from the database and applies
				}
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

function promoCodeExists(doc, codeString)
{
	return (codeString.toUpperCase() == doc.data().value);

}
function isValidPromoCode(doc)
{
	return doc.data().valid; 
}

// TODO: Promo code boolean valid fields need to be per user, not global
function resetPromoCodes()
{
	const db = firebase.firestore();
	db.collection("promo-codes").get().then(function(querySnapshot) {
		querySnapshot.forEach(function(doc) {
			doc.ref.update({ valid: true });
		});
	});
}

function applyPromoCode(promoCodeDoc)
{
	var codeString = promoCodeDoc.data().value;
	var discount =  promoCodeDoc.data().discount;

	// Update the promo code display messages
	updatePromoDisplays(codeString, discount);

	// Take the promo code's discount factor and update the price total
	var priceValue =  document.getElementById('total-price-value').textContent.substring(1); // Strip currency symbol
	var oldPrice = Number(priceValue);
	if(oldPrice == 0) {
		return;
	}

	var newPrice = oldPrice - oldPrice*discount;

	// Update the price and API
	updateTotal(newPrice);

	// Set promo code's valid to false since we've now used it
	promoCodeDoc.ref.update({ valid: false });
}

function updatePromoDisplays(codeString, discount)
{
	var promoMessage = document.getElementById('promo-message');
	var totalPromoMessage = document.getElementById('total-promo-message');

	// Transform decimal discount value to percentage 
	var percentage = ((discount*100).toString()) + '%';

	promoMessage.textContent = '"' + codeString + '"' + ' promo code applied successfully!';
	promoMessage.style.color = "lightgreen";

	totalPromoMessage.textContent = '> ' + percentage + ' discount applied!';
	totalPromoMessage.style.color = "lightgreen";
	totalPromoMessage.style.fontWeight = "bold";
}

// Function ti display checkout page
function displayCheckoutForm()
{
	var checkoutForm = document.getElementById('checkoutForm'); 
	
	// Show the checkout form html elements
	checkoutForm.style.display = "block";

	// Scroll to checkout form
	scrollViewToElement(checkoutForm);
}

function displayPaymentForm()
{
	var paymentForm = document.getElementById('paymentForm');
	paymentForm.style.display = "block";

	scrollViewToElement(paymentForm);
}

// Function to show main page
function displayMainForm(currentUser)
{
	// Hide the login screen
	document.getElementById('loginForm').style.display = "none";

	// Show the main page html elements
	document.getElementById('mainForm').style.display = "block";

	// Initially disable checkout button
	document.getElementById('checkout-button').disabled = "true";

	// Hide the checkout form html elements initially
	document.getElementById('checkoutForm').style.display = "none;"

	// Ensure the user's name is displayed correctly
	document.getElementById('displayNameField').textContent = currentUser.displayName;

	// Display the products
	var product_container= document.getElementById('product_container');

	// Clear out any items present
	product_container.innerHTML = "";
	
	// Render products
	getProducts(product_container);

	// Initialize the promo codes
	resetPromoCodes();

	// Display initial zero balance for price totals
	document.getElementById('subtotal-price-value').textContent = getUserCurrency().symbol + '0.00'; 
	document.getElementById('total-price-value').textContent = getUserCurrency().symbol + '0.00'; 
}

// Function to show login page
function displayLoginForm()
{
	// Hide the main screen
	document.getElementById('mainForm').style.display = "none";

	// Show the login page html elements
	document.getElementById('loginForm').style.display = "block";
}

function displayConfirmPurchaseButton()
{
    // Display purchase confirmation button
    document.getElementById('confirm-purchase-button').style.display = "block";
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
	let currency =  document.createElement('span');
	let price = document.createElement('span');
	let quantity = document.createElement('input');
	let add = document.createElement('button');
	let remove = document.createElement('button');

	// Set the class attributes for styling
	div.setAttribute('data-id', doc.id);
	div.setAttribute('class', "grid-item");
	name.setAttribute('class', "grid-item-names");
	canvas.setAttribute('class', "item-image");
	price.setAttribute('class', "price-value");
	currency.setAttribute('class', "currency-symbol");
	quantity.setAttribute('class', "quantity-box");
	add.setAttribute('class', "add-button");
	remove.setAttribute('class', "remove-button");

	image.src = doc.data().image_ref;
	name.textContent = doc.data().name + ': ';
	currency.textContent = getUserCurrency().symbol;
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
	div.appendChild(currency);
	div.appendChild(price);
	div.appendChild(br2);
	div.appendChild(quantity);
	div.appendChild(remove);
	div.appendChild(add);

	grid_container.appendChild(div);

}

function getUserCurrency()
{
	// Return user currency based on selected currency;
	// For now just handle USD
	return { currency: 'usd', symbol: '$' };
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


function updateCart()
{
	// Remove any existing promo messages
	document.getElementById('promo-message').innerHTML = "";
	document.getElementById('total-promo-message').innerHTML = "";

	// Reset the promo codes to all be valid
	resetPromoCodes();

	// Update the shopping bag with items selected
	updateItemsInBag();

	// Enabled/Disable checkout button based on if items in bag
	updateCheckoutButton();

	// Update the price and API
	updateTotals(checkoutItems());
}

function checkoutItems()
{
	var priceTotal = 0;
	var quantityTotal = 0;
	var quantityBoxes = document.getElementsByClassName("quantity-box");
	var priceValues = document.getElementsByClassName("price-value");

	// Total quantity is all items in the quantity boxes
	for (var i = 0; i < quantityBoxes.length; i++) {
		quantityTotal += quantityBoxes[i].value;
	}

	if (quantityTotal <= 0) {
		alert("No items selected.");
		updateTotals(0.00);
		return;
	}

	// Total price is quantity of the item multiplied by its price
	for (var i = 0; i < priceValues.length; i++) {
		priceTotal += Number(priceValues[i].textContent)*quantityBoxes[i].value;
	}

	return priceTotal;
}

function updateCheckoutButton()
{
	// If there are items in the checkout bag, enable checkout button
	var checkoutButton = document.getElementById('checkout-button');
	checkoutButton.disabled = !(document.getElementById('bagged-items').hasChildNodes()); 
}

function updateItemsInBag()
{
	var baggedItems = document.getElementById('bagged-items');
	var quantityBoxes = document.getElementsByClassName("quantity-box");
	var itemNames = document.getElementsByClassName("grid-item-names");

	// Clear out existing items to update with new ones
	baggedItems.innerHTML = ""; 
	
	for (var i = 0; i < quantityBoxes.length; i++) {
		if(quantityBoxes[i].value <= 0) {
			continue;
		}
		let itemLabel = document.createElement('label');
		itemLabel.setAttribute('class', 'bagged-item-label');

		var itemName = (itemNames[i].textContent).substring(0, itemNames[i].textContent.length - 2);
		var quantity = quantityBoxes[i].value.toString();

		itemLabel.textContent =  quantity + 'x: ' + itemName;
		baggedItems.appendChild(itemLabel);
	}

	// Scroll to shopping cart
	scrollViewToElement(baggedItems);
}

function updateSubTotal(price)
{
	document.getElementById('subtotal-price-value').textContent =  getUserCurrency().symbol + price.toFixed(2);

}

function updateTotal(price)
{
	document.getElementById('total-price-value').textContent =  getUserCurrency().symbol + price.toFixed(2);

	// Send the total price to Brainblocks API
	updateBrainblocksPrice(price);
}

function updateTotals(price)
{
	// Update the total prices in html
	updateSubTotal(price);
	updateTotal(price);
}

function checkoutUser()
{
	displayCheckoutForm();
}

function updateBrainblocksPrice(price)
{
	// May add currency coversions here

	// If existing button is there, remove it.
	document.getElementById('nano-button').innerHTML = "";

	// Rerender the button
	renderBrainblocks(price);
}

function renderBrainblocks(price)
{
    // Render the Nano button
    brainblocks.Button.render({

        // Pass in payment options
        payment: {
            destination: 'xrb_3rndbrwsycws3x3hdr4p48hf55s6zgco4xaxgjcsrmdy8ijonew1i6s5miig',
            currency:    getUserCurrency().currency,
            amount:      price
        },

        // Handle successful payments
        onPayment: function(data) {
            console.log('Payment successful!', data.token);
            displayConfirmPuchaseButton();
        }

    }, '#nano-button');
}

// Utilities
function setTwoNumberDecimal(event) {
    this.value = parseFloat(this.value).toFixed(2);
}

function scrollViewToElement(element)
{
	// Scroll to a form/element
	element.scrollIntoView({ 
  		behavior: 'smooth'
	});
}