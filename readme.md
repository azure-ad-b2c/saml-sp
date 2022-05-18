For SAML integration, see [Register a SAML application in Azure AD B2C](https://docs.microsoft.com/en-us/azure/active-directory-b2c/connect-with-saml-service-providers)

### Test with the SAML test app

You can use our live demo [SAML test application](https://aka.ms/samltestapp). To test your configuration:

* Update the tenant name.
* Update the policy name. For example, use *B2C_1A_signup_signin_saml*.
* Specify the issuer URI. Use one of the URIs found in the `identifierUris` element in the application registration manifest. For example, use `https://contoso.onmicrosoft.com/app-name`.
