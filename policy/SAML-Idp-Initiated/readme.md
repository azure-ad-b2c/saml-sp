## Scenario
This policy will launch an IdP initiated SAML authentication.  

Here an external IdP must send a SAML assertion to AAD B2C.
AAD B2C will validates the SAML assertion using the IdPs metadata endpoint as presented in the `TESTIDP` technical profile `<Item Key="PartnerEntity">https://testmysaml.azurewebsites.net/Metadata</Item>`.  \

AAD B2C will then pass through the claims in this example to a SAML Assertion issued back to the SAML Relying party.
You can use the claims to look up and read/write an account if needed, similar to how the social account samples work.

The IdP Technical Profile must contain the following metadata item for IdP Initiated logons to work.
`<Item Key="IdpInitiatedProfileEnabled">true</Item>`

To test this policy, you can use the `https://testmysaml.azurewebsites.net/IDP` endpoint. This endpoint will generate a SAML Assertion for a dummy user to AAD B2C. Fill in your tenant and policy Id to execute an IdP Initiated request. The response will come back to the same website as it acts as both an IdP and SP.