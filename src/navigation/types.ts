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

// 👇 AJOUTE CECI
export type IdeasStackParamList = {
  IdeasList: undefined;
  IdeaEditor: { ideaId?: string }; // le `?` rend `ideaId` optionnel
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
  timestamp: any; // ou Timestamp
  teamId: string;
};

export type Idea = {
  author: string;
  id: string;
  title: string;
  description: string;
  votes: number;
  teamId: string;
  createdAt: any;
};
