import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// Type definitions
export interface Template {
  id?: string;
  name: string;
  description?: string;
  shifts: TemplateShift[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemplateShift {
  id: string;
  name: string;
  role: string;
  roleName: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  status: 'AVAILABLE' | 'ASSIGNED';
}

// Get templates collection reference
const getTemplatesCollection = () => {
  return collection(db, 'templates');
};

// Get template document reference
const getTemplateDocRef = (templateId: string) => {
  return doc(db, 'templates', templateId);
};

// Create a new template
export const createTemplate = async (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
  try {
    const dataWithTimestamp = {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const templatesCollection = getTemplatesCollection();
    const docRef = await addDoc(templatesCollection, dataWithTimestamp);

    return {
      ...templateData,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

// Get all templates
export const getAllTemplates = async (): Promise<Template[]> => {
  try {
    const templatesCollection = getTemplatesCollection();
    const snapshot = await getDocs(templatesCollection);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Template[];
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Get a single template by ID
export const getTemplate = async (templateId: string): Promise<Template | null> => {
  try {
    const templateRef = getTemplateDocRef(templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      return null;
    }
    
    return {
      ...templateDoc.data(),
      id: templateDoc.id,
      createdAt: templateDoc.data().createdAt?.toDate(),
      updatedAt: templateDoc.data().updatedAt?.toDate()
    } as Template;
  } catch (error) {
    console.error(`Error fetching template ${templateId}:`, error);
    throw error;
  }
};

// Update a template
export const updateTemplate = async (templateId: string, templateData: Partial<Template>): Promise<void> => {
  try {
    const templateRef = getTemplateDocRef(templateId);
    const dataWithTimestamp = {
      ...templateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(templateRef, dataWithTimestamp);
  } catch (error) {
    console.error(`Error updating template ${templateId}:`, error);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const templateRef = getTemplateDocRef(templateId);
    await deleteDoc(templateRef);
  } catch (error) {
    console.error(`Error deleting template ${templateId}:`, error);
    throw error;
  }
}; 