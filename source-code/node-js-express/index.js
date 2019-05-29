const port = 3000
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var saml2 = require('saml2-js');
var fs = require('fs');
var session = require('express-session');

app.use(bodyParser.urlencoded({
  extended: true
}));

// Initialize the session 
app.use(session({
  secret: 'eXbbYkwMsO7l7tBcdvblOwQFxSajUe9sUA4y/BXEZ3w=',
  resave: true,
  saveUninitialized: true
}));

// Create service provider
var sp_options = {
  entity_id: "http://localhost:3000/saml/metadata",
  private_key: fs.readFileSync("certificates\\sp-cert-private.pfx").toString(),
  certificate: fs.readFileSync("certificates\\idp-cert-public.crt").toString(),
  assert_endpoint: "http://localhost:3000/saml/assert",
  allow_unencrypted_assertion: true
};
var sp = new saml2.ServiceProvider(sp_options);

// Create identity provider
// Azure AD B2C metadata:
var idp_options = {
  sso_login_url: "https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/B2C_1A_SAML2_signup_signin/samlp/sso/login",
  sso_logout_url: "https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/B2C_1A_SAML2_signup_signin/samlp/sso/logout",
  certificates: [fs.readFileSync("certificates\\idp-cert-public.crt").toString()]
};
var idp = new saml2.IdentityProvider(idp_options);

// ------ Define express endpoints ------

// Homepage
app.get("/", function (req, res) {
  res.send(getHTML(req.session.userName));
});

// Endpoint to retrieve metadata
app.get("/saml/metadata", function (req, res) {
  res.type('application/xml');
  res.send(sp.create_metadata());
});

// Starting point for login
app.get("/saml/login", function (req, res) {
  sp.create_login_request_url(idp, {}, function (err, login_url, request_id) {
    if (err != null)
      return res.send(500);
    res.redirect(login_url);
  });
});

// Assert endpoint for when login completes
app.post("/saml/assert", function (req, res) {
  var options = { request_body: req.body };
  sp.post_assert(idp, options, function (err, saml_response) {
    if (err != null)
      return res.send(500);

    if (saml_response.type == 'logout_response') {
      // Cleare name_id and session_index for logout and welcome screen
      req.session.name_id = null;
      req.session.session_index = null;
      req.session.userName = null;

    }
    else {
      // Save name_id and session_index for logout and welcome screen
      req.session.name_id = saml_response.user.name_id;
      req.session.session_index = saml_response.user.session_index;
      req.session.userName = saml_response.user.name;
    }
    res.redirect("/")
  });
});

// Starting point for logout
app.get("/saml/logout", function (req, res) {
  var options = {
    name_id: req.session.name_id,
    session_index: req.session.session_index,
  };

  sp.create_logout_request_url(idp, options, function (err, logout_url) {
    if (err != null)
      return res.send(500);
    res.redirect(logout_url);
  });
});

function getHTML(name) {
  return `<html>

    <head>
        <title>Node.js express SAML RP application</title>
        <!-- Latest compiled and minified CSS -->
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    
        <!-- jQuery library -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    
        <!-- Latest compiled JavaScript -->
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    </head>
    
    <body>
        <div style="margin:100px;">
            <nav class="navbar navbar-inverse navbar-static-top">
                <div class="container">
                    <a class="navbar-brand" href="/">Node.js express SAML RP application</a>
                    <ul class="nav navbar-nav">
                        <li class="active">
                            <a href="/">Home</a>
                        </li>
                        <li>
                            <a href="/saml/metadata">SP Metadata</a>
                        </li>
                        <li>`
    + (name ? '<a href="/saml/logout">Logout</a>' : '<a href="/saml/login">Login</a>') +
    `</li>
                    </ul>
                </div>
            </nav>
            <div class="jumbotron" style="padding:40px;">
                <h3>`
    + (name ? 'Welcome: ' + name : 'To sign-in please click on the <a href="/saml/login">login</a> button') +
    `</h3>
                <p>This solution demonstrates how to integrate Node.js application with Azure AD B2C, using SAML protocol. The solution is based on <a href='https://www.npmjs.com/package/saml2-js'>saml2-js package</a></p>
                <a class="btn btn-primary btn-lg" href="https://github.com/yoelhor/advance-scenarios/tree/master/policies/saml-relying-party" role="button">Learn more</a>
            </div>
        </div>
    </body>
    
    </html>`
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
