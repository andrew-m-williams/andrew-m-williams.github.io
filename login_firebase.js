// Sign up new users 
function handleSignUp()
{
	// Check for valid user input
	var email = document.getElementById('signUpEmail').value;
	var password = document.getElementById('signUpPassword').value;
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

	//window.location.href = "ecommerce_mainpage.html"
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
			//document.getElementById()
		});

		}
	}
}

