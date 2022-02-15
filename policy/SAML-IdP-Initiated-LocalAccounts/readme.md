# SAML IdP initiated policy sample

## Prerequisites
1. Deploy the Azure AD B2C [custom policy](https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-overview) starter pack using the [IEF Setup tool](https://aka.ms/iefsetup)
1. Follow the documentation for: [Register a SAML application in Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/saml-service-provider?tabs=windows&pivots=b2c-custom-policy)
1. Follow the documentation for:  [Configure IdP-initiated flow](https://docs.microsoft.com/azure/active-directory-b2c/saml-service-provider-options?pivots=b2c-custom-policy#configure-idp-initiated-flow)

## Usage of this sample
Once the prerequisites have been followed, you can upload the policy file from the policy folder into your tenant.

Test the policy by visiting `https://<tenant-name>.b2clogin.com/<tenant-name>.onmicrosoft.com/<policy-name>/generic/login?EntityId=<app-identifier-uri>&RelayState=<relay-state>`
