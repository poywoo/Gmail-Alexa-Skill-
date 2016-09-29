# Gmail-Alexa-Skill-

This simple GMail Alexa skill allows users to authenticate into a GMail account and retrieve the unread messages, and either read it aloud or skip. 

Setup
============================================
To run this skill you need to deploy the code in lambda and configure the Alexa skill to use lambda. 

AWS Lambda Setup
============================================
1. Sign into the AWS console (aws.amazon.com) and click on the Lambda link. Make sure you are in us-east. 
1. Click create a Lambda Function
1. Skip the blueprint 
1. Configure triggers by adding "Alexa Skill Kit"
1. Name the function "GMail-Reader-Skill"
1. Select the runtime as Node.js
1. Select all the files and create a zip file. (Remember to run "npm install" inside your directory to install all the dependencies.)
1. Select Code entry type as "Upload a .ZIP file" and then upload the .zip file to the Lambda
1. Keep the Handler as index.handler (this refers to the main js file in the zip).
1. Create a basic execution role and click create.
1. Leave the Advanced settings as the defaults.
1. Click "Next" and review the settings then click "Create Function"
1. Copy the ARN from the top right to be used later in the Alexa Skill Setup

Alexa Skill Setup
============================================
1. Go to the Alexa Console (developer.amazon.com) and click Alexa > Get Started > Add a New Skill. 
2. Select Custom Interaction Model as the skill type. Set "GMailReader" as the skill name and "G mail reader" as the invocation name. 
3. Copy the Intent Schema from the included IntentSchema.json
4. Copy the Sample Utterances from the included SampleUtterances.txt
5. Select the Lambda ARN for the skill Endpoint and paste the ARN copied from above.
6. Click yes to enable account linking. Set the GMail Authorization URL and visit the Google API Console to obtain OAuth 2.0 credentials. (You need a client ID and client secret that are known to both Google and your application).
7. Add https://mail.google.com/ and https://www.googleapis.com/auth/gmail.modify to scope. 
8. Select "Implicit Grant" as the Authorization Grant Type. 
9. Add https://www.google.com/intl/en_us/mail/help/terms.html as privacy policy URL. 
10. Add the CLIENT_ID, CLIENT_SECRET, and REDIRECT_URL variables in index.js. 
11. [optional] go back to the skill Information tab and copy the appId. Paste the appId into the index.js file for the variable APP_ID, then update the lambda source zip file with this change and upload to lambda again, this step makes sure the lambda function only serves request from authorized source.
12. Your skill is now ready to test! 

Examples 
============================================
`User: Alexa, ask G Mail reader to check mail.`

`Alexa: You have 3 unread  messages  in your account. Do you want me to list them?`

`User: Yes`

`Alexa: Message from Jennifer Lawson received on Monday August 4 at 2:40 P M with subject Hello World`

`User: Read`

`Alexa: Hello! How are you doing? End of message. Do you want to list the next message?`

`User: Yes`

`Alexa: Message from Ashley Brown received on Sunday September 2 at 4 P M with subject Meeting`

`User: Next`

`Alexa: Message from Pandora  received on Friday September 6 at 3:20 P M with subject New music`

`User: Next`

`Alexa: There are no more unread messages to list. Goodbye.`

