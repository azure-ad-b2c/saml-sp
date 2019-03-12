# Configure SAML Relying party application 

This document will walk you through adding a SAML-based Relying party
to Azure AD B2C. The [SAML RP Reference document](saml-rp-spec.md) contains more details around each of the XML elements referenced in this article.

## Important note
**SAML Relying Party support is available as a preview feature.** Support is not available for the general public on this functionality as it has only been tested on some specific modalities. The implementation may be changed in the future without notifying you. Customers should NOT use preview features in a production environment.


**If you are interested in this feature, make sure to [vote for it](https://feedback.azure.com/forums/169401-azure-active-directory/suggestions/15334323-saml-protocol-support) in order to support it and get updates on its progress.**

## SAML relying party scenarios
This will enable scenarios such as Contoso has an app, *Contoso Rewards*, where their customers, who are consumers, keep track of their rewards points obtained by purchasing Contoso products in retail stores. Contoso also wants to allow these consumers to use their same Contoso account to access a third-party app, *3D Metrics*, to check out rewards points charts and metrics available only through that app.

-   Use Azure AD B2C
-   Local accounts
-   SAML RP for 3D Metrics’ SSO

This walkthrough will only focus on the SAML RP piece of this scenario.

Walkthrough
===========

## Prerequisites

- Complete the steps in the [Get started with custom policies in Active Directory B2C](active-directory-b2c-get-started-custom.md).
- For this sample policy, you can use any policy of the [starter pack](https://github.com/Azure-Samples/active-directory-b2c-custom-policy-starterpack), such as SocialAndLocalAccounts, or SocialAndLocalAccountsWithMFA 


## 1. Setup the certificates
To build a trust between your relying party application and Azure AD B2C, you need to provide valid X509 certificates (with the private key). 

1. Certificate with private key stored on the Web App. This is used to sign the SAML Request sent to Azure AD B2C.

2. Certificate with private key provided to Azure AD B2C. This is used to sign and/or encrypt the SAML Response that Azure AD B2C provides back to the SAML Relying Party.

### 1.1 Preparing self-signed certificate
If you don’t have a certificate already, you can create a self-signed certificate [using
makecert](http://www.virtues.it/2015/08/howto-create-selfsigned-certificates-with-makecert/)

1. Run this command to generate a self signed certificate:

       makecert -r -pe -n "CN=yourappname.yourtenant.onmicrosoft.com" -a sha256 -sky signature -len 2048 -e 12/21/2018 -sr CurrentUser -ss My YourAppNameSamlCert.cer

2. Go to the certificate store > Manage User Certificates &gt; Current
    User &gt; Personal &gt; Certificates &gt;
    yourappname.yourtenant.onmicrosoft.com

3. Right click the certificate &gt; All Tasks &gt; Export

4. Select Yes, export the private key

5. Select the defaults for Export File Format

6. Provide a password for the certificate

### 1.2 Upload the certificate

Whether you have a valid certificate issued by certificate authority, or a self-signed certificate, you need to upload the certificate to the Azure AD B2C Policy Keys area. To do so:

1. Go to your Azure AD B2C tenant. Click **Settings > Identity Experience Framework > Policy Keys**.

1. Click **+Add**, and then click **Options > Upload**.

1. Enter a **Name** (for example, YourAppNameSamlCert). The prefix B2C_1A\_ is automatically added to the name of your key.

1. **Upload** your certificate using the upload file control.

1. Enter the **certificate's password**.

1. Click **Create**.

1. Verify that you've created a key (for example, B2C_1A_YourAppNameSamlCert).

## 2. Prepare your policy
### 2.1 Create the SAML Token Issuer

Now let’s go ahead and
add the capability for your tenant to issue SAML tokens.

> ***Note**: The [SAML RP Reference document](saml-rp-spec.md) contains more details around each of the XML elements referenced in
> this section.*

Open the **TrustFrameworkExtensions.xml** policy from your working directory. Locate the section with the &lt;ClaimsProviders&gt; and add the following XML snippet.

```xml
<ClaimsProvider>
  <DisplayName>Token Issuer</DisplayName>
  <TechnicalProfiles>
    <!-- SAML Token Issuer technical profile -->
    <TechnicalProfile Id="Saml2AssertionIssuer">
      <DisplayName>Token Issuer</DisplayName>
      <Protocol Name="None" />
      <OutputTokenFormat>SAML2</OutputTokenFormat>
      <Metadata>
        <!-- The issuer contains the policy name, should the same one as configured in the relaying party application-->
        <Item Key="IssuerUri">https://tenant-name.b2clogin.com/tenant-name.onmicrosoft.com/policy-name</Item>
      </Metadata>
      <CryptographicKeys>
        <Key Id="MetadataSigning" StorageReferenceId="B2C_1A_YourAppNameSamlCert" />
        <Key Id="SamlAssertionSigning" StorageReferenceId="B2C_1A_YourAppNameSamlCert" />
        <Key Id="SamlMessageSigning" StorageReferenceId="B2C_1A_YourAppNameSamlCert" />
      </CryptographicKeys>
      <InputClaims/>
      <OutputClaims/>
      <UseTechnicalProfileForSessionManagement ReferenceId="SM-Saml" />
    </TechnicalProfile>

    <!-- Session management technical profile for SAML based tokens -->
    <TechnicalProfile Id="SM-Saml">
      <DisplayName>Session Management Provider</DisplayName>
      <Protocol Name="Proprietary" Handler="Web.TPEngine.SSO.SamlSSOSessionProvider, Web.TPEngine, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
    </TechnicalProfile>
  </TechnicalProfiles>
</ClaimsProvider>
```

* IssuerUri – This is the Issuer Uri that will be returned in the SAML Response from Azure AD B2C. Your relying party will be configured to accept an Issuer URI during SAML Assertion validation. This Issuer URI must be provided in the above XML snippet.

### 2.2 Setup the user journey

At this point, the SAML issuer has been set up, but it’s not available in any of the user journeys. To make it available, you create a duplicate of an existing templated user journey, and then modify it so that it issues an SAML token instead of JWT.

1. Open the *TrustFrameworkBase.xml* file from the starter pack.
1. Find and copy the entire contents of the **UserJourney** element that includes `Id="SignUpOrSignIn"`.
1. Open the *TrustFrameworkExtensions.xml* and find the **UserJourneys** element. If the element doesn't exist, add one.
1. Paste the entire content of the **UserJourney** element that you copied as a child of the **UserJourneys** element.
1. Rename the ID of the user journey from `SignUpOrSignIn` to `SignUpSignInSAML`.
1. In the last orchestration step, change the value of `CpimIssuerTechnicalProfileReferenceId` property, from `JwtIssuer` to `Saml2AssertionIssuer`.


Save your changes and upload the updated policy. This time, make sure you check the *Overwrite the policy if it exists* checkbox. At this point, this will not have any effect, the intent of uploading is to confirm that what you’ve added thus far doesn’t have any syntactical issues.

## 3. Add the SAML Relaying Party policy

Now that your tenant can issue SAML tokens, we need to create the SAML relying party policy

### 3.1 Create sign-up or sign-in policy
1.  Copy the **SignUpOrSignin.xml** file from your working directory, rename it to match the Id of the new journey you created i.e.  **SignUpOrSigninSAML.xml**

1. Open the **SignUpOrSigninSAML.xml** file

1.  Replace the policy name **B2C_1A_signup_signin** to **B2C_1A_signup_signin_SAML**

1. Replace the entire &lt;TechnicalProfile&gt; element with the following:

```xml
<TechnicalProfile Id="PolicyProfile">
  <DisplayName>PolicyProfile</DisplayName>
  <Protocol Name="SAML2"/>
  <Metadata>
    <Item Key="PartnerEntity">https://my-account.blob.core.windows.net/azure-ad-b2c/spring_saml_metadata.xml</Item>
  </Metadata>
  <OutputClaims>
    <OutputClaim ClaimTypeReferenceId="displayName" />
    <OutputClaim ClaimTypeReferenceId="givenName" />
    <OutputClaim ClaimTypeReferenceId="surname" />
    <OutputClaim ClaimTypeReferenceId="email" DefaultValue="" />
    <OutputClaim ClaimTypeReferenceId="identityProvider" DefaultValue="" />
    <OutputClaim ClaimTypeReferenceId="objectId" PartnerClaimType="objectId"/>
  </OutputClaims>
  <SubjectNamingInfo ClaimType="objectId" ExcludeAsClaim="true"/> 
</TechnicalProfile>
```

### 3.2 Update the metadata
The metadata can be configured (in both parties) as "Static Metadata", or "Dynamic Metadata". In static mode, you copy the entire metadata from one party and set it in the other party. In dynamic mode, you set the URL to the metadata, while the other party reads the configuration dynamically. The principle is the same, you provide the Azure B2C policy's metadata in your service provider (relying party). And provide your service provider's metadata to Azure AD B2C.

Each SAML relying party application has different steps to set and read the identity provider metadata. Azure AD B2C can read the service providers metadata. Look at your relying party application’s documentation for guidance on how to do so. You need your relying party applications' metadata URL or XML document to set in Azure AD B2C relying party policy file.

The following is an example of dynamic metadata. Update the &lt;Item&gt; with Key="PartnerEntity" by adding the URL of the SAML RP’s metadata, if such exists:

```XML
<Item Key="PartnerEntity">https://app.com/metadata</Item>
```

> Note: the Service Provider metadata should be publicly available. If your app is running under https://localhost, copy and upload the metadata file to an anonymous web server.

Following is an example of static metadata. Update the &lt;Item&gt; with Key="PartnerEntity" by adding the XML of the SAML RP’s metadata inside the `<![CDATA[Put your metadata here]]>`:

```XML
<Item Key="PartnerEntity"><![CDATA[

<m:EntityDescriptor entityID="https://localhost/" 
    ID="_4fda7894-5926-4615-a0d3-fc55acf29623" 
    validUntil="20130-01-01T00:00:00.7692433Z" 
    xmlns:m="urn:oasis:names:tc:SAML:2.0:metadata">
	
  <m:SPSSODescriptor 
      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" 
      WantAssertionsSigned="true" 
      AuthnRequestsSigned="false" >
		
    <m:SingleLogoutService 
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" 
      Location="http://localhost/Auth/SingleLogout" 
      ResponseLocation="http://localhost/Auth/LoggedOut" />
		
    <m:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:EmailAddress</m:NameIDFormat>
		
    <m:AssertionConsumerService 
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" 
      Location="http://localhost/Auth/saml2" 
      index="0" 
      isDefault="true" />
		<m:AttributeConsumingService index="0" isDefault="true">
			<m:ServiceName xml:lang="en">My application</m:ServiceName>
			<m:RequestedAttribute Name="urn:oid:2.5.4.4" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" isRequired="true" />
			<m:RequestedAttribute Name="urn:oid:2.5.4.3" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" isRequired="false" />
		</m:AttributeConsumingService>
	</m:SPSSODescriptor>
</m:EntityDescriptor>
        ]]></Item>
```

### 3.3 Upload and test your policy metadata

Save your changes and upload this new policy. After you uploaded both policies (the extension and the relying party), open a web browser and navigate to the policy metadata. The Azure AD B2C policy metadata is available in following URL address, replace the:
* **tenant-name** with your tenant name
* **policy-name** with your policy name 

```
https://tenant-name.b2clogin.com/tenant-name.onmicrosoft.com/policy-name/Samlp/metadata
```


## 4. Setup the SAML IdP in the App / SAML RP

You’ll need to setup B2C as a SAML IdP in the SAML RP / application.
Each application has different steps to do so, look at your app’s
documentation for guidance on how to do so. You will be required to
provide some or all the following data points:

-   **Metadata:**

    `https://tenant-name.b2clogin.com/tenant-name.onmicrosoft.com/policy-name/Samlp/metadata`

-   **Issuer:**

    `https://tenant-name.b2clogin.com/tenant-name.onmicrosoft.com/policy-name`

-   **Login URL / SAML Endpoint / SAML URL:**
    Look and the metadata file
    

-   **Certificate:**

    This is the B2C_1A_YourAppNameSamlCert, but without the private key. To get the public key of the certificate do the following:

1.  Go to the metadata URL specified above.
1.  Copy the value in the &lt;X509Certificate&gt; element
1.  Paste it into a text file
1.  Save the text file as a .cer file

## Solution artifacts 
- [TrustFrameworkExtensions.xml]()  The extensions policy file - holds the technical profile that issues a SAML token, SAML session management and the *SignUpSignInSAML* user journey.
- [SignUpOrSigninSAML.xml](SignUpOrSigninSAML.xml) the relying party policy containing the SAML metadata configuration. Output claims and a reference to the *SignUpSignInSAML*user journey 


## SAML web applications

<table border="0" style="border:none;">
    <tr style="border: none;">
        <td style="padding-left:0; border: none;"><a href="https://github.com/UNIFYSolutions/Azure-B2C" ><img src="https://docs.microsoft.com/azure/app-service/media/index/logo_net.svg" height="48px" width="48px" alt=".Net Core" ><br /><span>.Net Framework</span></a></div></td>
        <td style="padding-left:20px; border: none;"><a href="https://github.com/yoelhor/advance-scenarios/tree/master/policies/saml-relying-party/source-code/node-js-express" ><img src="https://docs.microsoft.com/azure/app-service/media/index/logo_nodejs.svg" height="48px" width="48px" alt="Node.js" ><br /?<span>Node.js</span></a></div></td>
        <td style="padding-left:20px; border: none;"><a href="https://github.com/yoelhor/aad-b2c-spring-security-saml" ><img src="https://docs.microsoft.com/azure/app-service/media/index/logo_java.svg" height="48px" width="48px" alt="Java" ><br /><span>Java</span></a></div></td>
<td style="padding-left:20px; border: none;"><a href="https://github.com/yoelhor/advance-scenarios/tree/master/policies/saml-relying-party/source-code/adfs-claims-provider" ><img src="https://docs.microsoft.com/azure/app-service/media/index/webapp.svg" height="48px" width="48px" alt="Java" ><br /><span>ADFS</span></a></div></td>
    </tr>
</table>

 ## (Optional) Enable Debugging in your User Journey(s)

You can enable Application Insights to help you follow through each of the orchestration steps in the UserJourney and get details on issues that occur. This should only be enabled during development. For more information, see [Azure Active Directory B2C: Collecting Logs](https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-troubleshoot-custom.)


