// src/navigation/types.ts
export type RootStackParamList = {
  Login: undefined;
  Register: {
    email?: string;
    redirectToInvitation?: boolean;
    invitationId?: string;
  };
  Home: undefined;
  Invitation: {
    email: string;
    id: string;
  };
  Main: undefined;
  Profile: undefined;
  SelectTeam: undefined;
  CreateTeam: undefined;
};
