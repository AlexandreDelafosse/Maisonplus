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

export type Note = {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  teamId: string;
  userId: string;
  author: string;
};

export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  timestamp: any; // ou Timestamp si tu veux être plus précis
  teamId: string;
};