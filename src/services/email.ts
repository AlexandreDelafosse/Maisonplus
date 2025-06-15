export async function sendEmailInvitation(
email: string, firstName: string, teamName: string, id: string) {
  try {
    const response = await fetch('http://192.168.1.11:3000/send-invitation', {
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
