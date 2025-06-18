// src/services/firestoreHelpers.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';

// ============================================
// TYPES TYPESCRIPT
// ============================================
export interface User {
  id: string;
  displayName: string;
  email: string;
  teams: string[];
  currentTeam: string | null;
  createdAt: Date;
  lastActive: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  templateType: 'famille' | 'coloc' | 'amis' | 'custom';
  enabledModules: string[];
  color: string;
  createdBy: string;
  createdAt: Date;
  members: string[];
  settings: {
    allowMemberInvite: boolean;
    requireApprovalForJoin: boolean;
    maxMembers: number;
  };
}

export interface UserTeam {
  id: string;
  userId: string;
  teamId: string;
  role: 'admin' | 'member' | 'viewer';
  permissions: string[];
  joinedAt: Date;
  invitedBy?: string;
  status: 'active' | 'pending' | 'left';
}

// ============================================
// TEMPLATES D'ÉQUIPES
// ============================================
export const TEAM_TEMPLATES = {
  famille: {
    name: "Ma Famille",
    description: "Organisation familiale",
    enabledModules: ['calendar', 'tasks', 'notes', 'chat'],
    color: '#FF6B6B',
    settings: {
      allowMemberInvite: true,
      requireApprovalForJoin: false,
      maxMembers: 15
    }
  },
  coloc: {
    name: "Ma Colocation",
    description: "Gestion de la colocation", 
    enabledModules: ['tasks', 'finances', 'calendar', 'chat'],
    color: '#4ECDC4',
    settings: {
      allowMemberInvite: true,
      requireApprovalForJoin: true,
      maxMembers: 8
    }
  },
  amis: {
    name: "Mes Amis",
    description: "Groupe d'amis",
    enabledModules: ['calendar', 'notes', 'chat'],
    color: '#45B7D1',
    settings: {
      allowMemberInvite: true,
      requireApprovalForJoin: false,
      maxMembers: 25
    }
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export class TeamManager {
  
  // ==========================================
  // USER FUNCTIONS
  // ==========================================
  
  /**
   * Récupère les données d'un utilisateur
   */
  static async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;
      
      const data = userDoc.data();
      return {
        id: userDoc.id,
        displayName: data.displayName,
        email: data.email,
        teams: data.teams || [],
        currentTeam: data.currentTeam || null,
        createdAt: data.createdAt?.toDate(),
        lastActive: data.lastActive?.toDate()
      };
    } catch (error) {
      console.error('Erreur getUser:', error);
      return null;
    }
  }

  /**
   * Récupère l'équipe actuelle de l'utilisateur
   */
  static async getCurrentTeamId(userId: string): Promise<string | null> {
    const user = await this.getUser(userId);
    return user?.currentTeam || null;
  }

  /**
   * Change l'équipe active d'un utilisateur
   */
  static async switchTeam(userId: string, teamId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        currentTeam: teamId,
        lastActive: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erreur switchTeam:', error);
      return false;
    }
  }

  /**
   * Met à jour les équipes d'un utilisateur
   */
  static async updateUserTeams(userId: string, teams: string[]): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        teams: teams,
        lastActive: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erreur updateUserTeams:', error);
      return false;
    }
  }

  // ==========================================
  // TEAM FUNCTIONS  
  // ==========================================

  /**
   * Crée une nouvelle équipe à partir d'un template
   */
  static async createTeam(
    userId: string, 
    templateType: keyof typeof TEAM_TEMPLATES,
    customName?: string
  ): Promise<string | null> {
    try {
      const template = TEAM_TEMPLATES[templateType];
      
      // Créer l'équipe
      const teamDoc = await addDoc(collection(db, 'teams'), {
        name: customName || template.name,
        description: template.description,
        templateType: templateType,
        enabledModules: template.enabledModules,
        color: template.color,
        createdBy: userId,
        createdAt: new Date(),
        members: [userId],
        settings: template.settings
      });

      // Créer la relation user-team
      await addDoc(collection(db, 'userTeams'), {
        id: `${userId}_${teamDoc.id}`,
        userId: userId,
        teamId: teamDoc.id,
        role: 'admin',
        permissions: ['invite', 'delete', 'modify', 'view'],
        joinedAt: new Date(),
        status: 'active'
      });

      // Mettre à jour les équipes de l'utilisateur
      const user = await this.getUser(userId);
      const newTeams = [...(user?.teams || []), teamDoc.id];
      await this.updateUserTeams(userId, newTeams);
      
      // Définir comme équipe active si c'est la première
      if (!user?.currentTeam) {
        await this.switchTeam(userId, teamDoc.id);
      }

      return teamDoc.id;
    } catch (error) {
      console.error('Erreur createTeam:', error);
      return null;
    }
  }

  /**
   * Récupère une équipe par son ID
   */
  static async getTeam(teamId: string): Promise<Team | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (!teamDoc.exists()) return null;

      const data = teamDoc.data();
      return {
        id: teamDoc.id,
        name: data.name,
        description: data.description,
        templateType: data.templateType,
        enabledModules: data.enabledModules || [],
        color: data.color,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate(),
        members: data.members || [],
        settings: data.settings
      };
    } catch (error) {
      console.error('Erreur getTeam:', error);
      return null;
    }
  }

  /**
   * Récupère toutes les équipes d'un utilisateur
   */
  static async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const user = await this.getUser(userId);
      if (!user?.teams?.length) return [];

      const teams: Team[] = [];
      for (const teamId of user.teams) {
        const team = await this.getTeam(teamId);
        if (team) teams.push(team);
      }

      return teams;
    } catch (error) {
      console.error('Erreur getUserTeams:', error);
      return [];
    }
  }

  /**
   * Vérifie si un module est activé pour une équipe
   */
  static async isModuleEnabled(teamId: string, module: string): Promise<boolean> {
    const team = await this.getTeam(teamId);
    return team?.enabledModules.includes(module) || false;
  }

  // ==========================================
  // PERMISSIONS & ROLES
  // ==========================================

  /**
   * Récupère le rôle d'un utilisateur dans une équipe
   */
  static async getUserRole(userId: string, teamId: string): Promise<string | null> {
    try {
      const userTeamDoc = await getDoc(doc(db, 'userTeams', `${userId}_${teamId}`));
      return userTeamDoc.exists() ? userTeamDoc.data().role : null;
    } catch (error) {
      console.error('Erreur getUserRole:', error);
      return null;
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  static async hasPermission(
    userId: string, 
    teamId: string, 
    permission: string
  ): Promise<boolean> {
    try {
      const userTeamDoc = await getDoc(doc(db, 'userTeams', `${userId}_${teamId}`));
      if (!userTeamDoc.exists()) return false;
      
      const permissions = userTeamDoc.data().permissions || [];
      const role = userTeamDoc.data().role;
      
      // Les admins ont toutes les permissions
      if (role === 'admin') return true;
      
      return permissions.includes(permission);
    } catch (error) {
      console.error('Erreur hasPermission:', error);
      return false;
    }
  }
}

// ============================================
// HOOKS REACT (Bonus)
// ============================================

/**
 * Hook pour écouter l'équipe actuelle en temps réel
 */
export const useCurrentTeam = () => {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      async (userDoc) => {
        if (userDoc.exists()) {
          const currentTeamId = userDoc.data().currentTeam;
          if (currentTeamId) {
            const team = await TeamManager.getTeam(currentTeamId);
            setCurrentTeam(team);
          }
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { currentTeam, loading };
};