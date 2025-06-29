require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Sib = require('sib-api-v3-sdk');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];

apiKey.apiKey = process.env.BREVO_API_KEY;

const sender = {
  email: 'alex.delaf@outlook.fr',
  name: 'Maison+',
};

app.post('/send-invitation', async (req, res) => {
  console.log('REQUETE RECUE:', req.body);
  const { email, firstName, teamName, id } = req.body;

  const invitationLink = `https://4b17-2a01-cb00-1c4-c700-c979-2dd1-b72a-9fc3.ngrok-free.app/--/invitation?email=${encodeURIComponent(email)}&id=${id}`; // exp://192.168.1.11:8081

  const tranEmailApi = new Sib.TransactionalEmailsApi();

  try {
    await tranEmailApi.sendTransacEmail({
      sender,
      to: [{ email, name: firstName }],
      subject: `Invitation à rejoindre l’équipe ${teamName}`,
      htmlContent: `
        <p>Bonjour ${firstName || 'utilisateur'},</p>
        <p>Vous avez été invité à rejoindre l’équipe <strong>${teamName}</strong>.</p>
        <p>Rejoignez-nous en cliquant ici :</p>
        <p><a href="${invitationLink}">${invitationLink}</a></p>
        <p>À bientôt !</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erreur Brevo :', err);
    res.status(500).json({ success: false, error: err });
  }
});

app.listen(3000, () => console.log('Serveur backend prêt sur le port 3000'));
