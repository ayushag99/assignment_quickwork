const express = require("express");
const router = express.Router();
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const url = require("url");

/*

    Setting up Gmail 

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

var oAuth2Client;

const getAuthUrl = () => {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	return authUrl;
};

const getNewToken = (code,res) => {
	oAuth2Client.getToken(code, (err, token) => {
		if (err) return res.json({success: false , msg:"An error occured in getting the token"})
		// If no error Occurs
		// Credentials for user from where the mail will be sent is set
		oAuth2Client.setCredentials(token);
		// Store the token to disk for later program executions
		fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			if (err) return res.json({success: false , msg:"An error occured while storing the credentials"})
			return res.json({success: true , msg:"Initialization Successful"})
		});
	});
};

const initialize = (res) => {
	// Loading client Application secret from local file
	fs.readFile(CREDENTIAL_PATH, (err, content) => {
		if (err)
			return res.json({
				success: false,
				msg: "Credentials file not found",
			});
		// Else
		// Credentials find was found and credential was found and read in content
		// Process the app credentials
		// Convert JSON string into object
		const credentials = JSON.parse(content);
		// Destucture the object
		const { client_id, client_secret, redirect_uris } = credentials.web;
		// Process the credentials
		oAuth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0]
		);
		// Read the User login token from the file 'token.json' in home directory of Project
		fs.readFile(TOKEN_PATH, (err, token) => {
			// If no token is stored -> get new token and store it
			if (err)
				return res.json({
					msg: "Authorize the API using the redirection link",
					redirec: getAuthUrl(),
				});
			// If token is already stored -> Return as the project is aleready initialized
			return res.json({
				success: true,
				msg: "Initialization Successful",
			});
		});
	});
};

/*

    ROUTES

*/

// HERE:
// @desc    API testing route
// @type    GET
// @path    /api
router.get("/", (req, res) => {
	res.send("API goes here...");
});

// HERE:
// @desc    Credentials Initializtion
// @type    GET
// @path    /api/init
router.get("/init", (req, res) => {
    // Checks if initialization and authorization is done
    // if done -> return a success message
    // else -> asks to give permission on the url returned by it
	initialize(res);
});

// HERE:
// @desc    Sends Email
// @type    POST
// @path    /api/sendemail
router.post("/sendemail", (req, res) => {});

// HERE:
// @desc    After authorization google redirects here
//          With this we can automatically fetch the code and get the token
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
    getNewToken(query.code , res);
});

module.exports = router;
