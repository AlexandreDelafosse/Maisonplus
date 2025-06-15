import * as functions from 'firebase-functions';
import axios from 'axios';

export const sendEmailInvitation = functions.https.onCall(async (data, context) => {
  const { email, teamName, inviteId } = data;

  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: 'service_phue9lg',
      template_id: 'template_2faflvi',
      user_id: 'TON_USER_ID_EMAILJS', // <-- récupère ça dans EmailJS dashboard
      template_params: {
        to_email: email,
        team_name: teamName,
        invite_link: `https://ton-app.com/invite/${inviteId}`,
      },
    });

    console.log('✅ Email envoyé via EmailJS', response.data);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur EmailJS :', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de l’envoi du mail'
    );
  }
});
