// Importing dependencies
const express = require("express");
const app = express();

// Setting up constants and enviroment variables
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));

// Importing Routes
const email_api = require("./routes/api/email_api");

app.use("/api/", email_api);

// ROUTES

// HERE:
// @desc    Testing Route
// @type    GET
// @path    /
app.get("/", (req, res) => {
	res.send("App is running fine...");
});

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.send",
];
const TOKEN_PATH = "token.json";
const CREDENTIAL_PATH = "credentials.json";
// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
	if (err) return console.log("Error loading client secret file:", err);
	// Authorize a client with credentials, then call the Gmail API.
	// authorize(JSON.parse(content), sendEmail);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	const { client_secret, client_id, redirect_uris } = credentials.web;
	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0]
	);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	console.log("Authorize this app by visiting this url:", authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question("Enter the code from that page here: ", (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error("Error retrieving access token", err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log("Token stored to", TOKEN_PATH);
			});
			callback(oAuth2Client);
		});
	});
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
	const gmail = google.gmail({ version: "v1", auth });
	//   gmail.users.labels.list({
	//     userId: 'me',
	//   }, (err, res) => {
	//     if (err) return console.log('The API returned an error: ' + err);
	//     const labels = res.data.labels;
	//     if (labels.length) {
	//       console.log('Labels:');
	//       labels.forEach((label) => {
	//         console.log(`- ${label.name}`);
	//       });
	//     } else {
	//       console.log('No labels found.');
	//     }
	//   });
	gmail.users.messages
		.send({
			userId: "me",
			resource: {
				raw: makeBody(
					"ayush.ashuvaish@gmail.com",
					"ayushcode0@gmail.com",
					"Archita And Anushka",
					"Print kardo Print kardo"
				),
			},
		})
		.then((result) => console.log(result))
		.catch((err) => console.log("\n\n AN ERROR OCCURED \n\n", err));
}
function makeBody(to, from, subject, message) {
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
}

const sendEmail = (auth) => {
	const gmail = google.gmail({ version: "v1", auth });
	gmail.users.messages
		.send({
			userId: "me",
			resource: {
				raw: makeBody(
					"ayush.ashuvaish@gmail.com",
					"ayushcode0@gmail.com",
					"Archita And Anushka",
					"Print kardo Print kardo"
				),
			},
		})
		.then((result) => console.log(result))
		.catch((err) => console.log("\n\n AN ERROR OCCURED \n\n", err));
};

app.listen(PORT, () => {
	console.log(`App is running on port ${PORT}...`);
});
