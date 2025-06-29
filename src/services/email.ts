export async function sendEmailInvitation(
email: string, firstName: string, teamName: string, id: string) {
  try {
    const response = await fetch('https://4b17-2a01-cb00-1c4-c700-c979-2dd1-b72a-9fc3.ngrok-free.app/send-invitation', { // http://192.168.1.11
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, teamName, id }), // 🟢 n'oublie pas id ic
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur backend: ${errorText}`);
    }

    return true;
  } catch (err) {
    console.error('Erreur fetch invitation :', err);
    throw err;
  }
}
