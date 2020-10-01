const express = require("express");
const router = express.Router();
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const url = require("url");

/*
######################################################################################

    OAuth2 Configuration

######################################################################################
*/

// We are setting the scope of Gmail API for
// Reading the mails
// Sending the mails
const SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.send",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";
const CREDENTIAL_PATH = "credentials.json";

let oAuth2Client;

fs.readFile(CREDENTIAL_PATH, (err, content) => {
	// Credentials file is must to run the application if not found application won't run
	if (err)
		return console.log(
			"ERROR: Credentials file not found, add credentials and restart"
		);
	/* 
        if credentials are found
        then
        oAuth Config...
    */

	// Parse the crdentials
	const credentials = JSON.parse(content);
	// Destucture the object
	const { client_id, client_secret, redirect_uris } = credentials.web;
	// oAuth Config...
	oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0]
	);
});

// oAuth Configuration Complete

/*
######################################################################################

    Functions

######################################################################################
*/
const initialize = (oAuth2Client, res) => {
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) {
			// Token does not exist
			return res.json({
				msg: "Authorize the API using the redirection link",
				redirec: getAuthUrl(oAuth2Client),
			});
		}
		// Token found
		oAuth2Client.setCredentials(JSON.parse(token));
		return res.json({
			success: true,
			msg: "Initialization Successful",
		});
	});
};

const getAuthUrl = (oAuth2Client) => {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	return authUrl;
};

const getNewToken = (oAuth2Client, code, res) => {
	oAuth2Client.getToken(code, (err, token) => {
		if (err)
			return res.json({
				success: false,
				msg: "Failed in generating token",
			});

		// If no error Occurs
		// Credentials for user from where the mail will be sent is set
		oAuth2Client.setCredentials(token);
		// Store the token to disk for later program executions
		fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			if (err)
				return res.json({
					success: false,
					msg: "Failed in saving the token",
				});

			res.json({
				success: true,
				msg: "Token successfuly generated and stored",
			});
		});
	});
};

// This functions return the string in base64 encoded format to send the mail
const makeEmailBody = (to, from, subject, message) => {
	var str = [
		'Content-Type: text/plain; charset="UTF-8"\n',
		"MIME-Version: 1.0\n",
		"Content-Transfer-Encoding: 7bit\n",
		"to: ",
		to,
		"\n",
		"from: ",
		from,
		"\n",
		"subject: ",
		subject,
		"\n\n",
		message,
	].join("");

	var encodedMail = new Buffer(str)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
	return encodedMail;
};
const sendEmail = (auth, email_details, cb) => {
	const gmail = google.gmail({ version: "v1", auth });
	gmail.users.messages
		.send({
			userId: "me",
			resource: {
				raw: makeEmailBody(
					email_details.to,
					"ayushcode0@gmail.com",
					email_details.subject,
					email_details.body
				),
			},
		})
		.then((result) => cb(result))
		.catch((err) => cb({ success: false, msg: "App is Unauthorized" }));
};

const checkAuthorization = (oAuth2Client) => {
	console.log(oAuth2Client);
	if (oAuth2Client && oAuth2Client.credentials) {
		// API is not authorized
		// Initilaization is required first
		console.log("Authorized");
		return;
	} else {
		// API is authorized
		console.log("Unauthorized");
		return;
	}
};

/*
######################################################################################

    ROUTES

######################################################################################
*/

// HERE:
// @desc    Credentials Initializtion
// @type    GET
// @path    /api/initialize
router.get("/initialize", (req, res) => {
	// Checks if initialization and authorization is done
	// if done -> return a success message
	// else -> asks to give permission on the url returned by it
	initialize(oAuth2Client, res);
});

// HERE:
// @desc    Sends Email
// @type    POST
// @path    /api/sendemail
router.post("/sendemail", (req, res) => {
	checkAuthorization(oAuth2Client);
	const { body, to, subject } = req.body;
	sendEmail(oAuth2Client, { to, subject, body }, (result) => {
		res.json(result);
	});
});

// HERE:
// @desc    After authorization google redirects here
//          With this we can automatically fetch the code and genearte the token
// @type    get
// @path    /api/authorize
router.get("/authorize", (req, res) => {
	/*
    After authorization google redirects to a localhost address, with code used to generate token
    we get the token from query stirng and save it in token.json file
    */
	const url_parts = url.parse(req.url, true);
	const query = url_parts.query;
	// code is stored in query.code
	// Generating and storing the token
	getNewToken(oAuth2Client, query.code, res);
});

module.exports = router;
