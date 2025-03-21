import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Project } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

const getInitialState = (): ProjectsState => {
  const savedProjects = localStorage.getItem('projects')
  return {
    projects: savedProjects ? JSON.parse(savedProjects) : [],
    loading: false,
    error: null
  }
}

const projectsSlice = createSlice({
  name: 'projects',
  initialState: getInitialState(),
  reducers: {
    addProject: (state, action: PayloadAction<Omit<Project, 'id' | 'createdAt'>>) => {
      const newProject: Project = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }
      state.projects.push(newProject)
      localStorage.setItem('projects', JSON.stringify(state.projects))
    },
    updateProject: (state, action: PayloadAction<Partial<Project> & { id: string }>) => {
      const index = state.projects.findIndex(project => project.id === action.payload.id)
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload }
        localStorage.setItem('projects', JSON.stringify(state.projects))
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(project => project.id !== action.payload)
      localStorage.setItem('projects', JSON.stringify(state.projects))
    }
  }
})

export const { addProject, updateProject, deleteProject } = projectsSlice.actions
export default projectsSlice.reducer 