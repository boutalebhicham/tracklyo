
"use client"

import React from 'react'
import type { Project } from '@/lib/definitions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProjectTabsProps = {
  projects: Project[]
  activeProjectId: string | null
  setActiveProjectId: (id: string) => void
  onAddProject: () => void
}

const ProjectTabs = ({ projects, activeProjectId, setActiveProjectId, onAddProject }: ProjectTabsProps) => {
  return (
    <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => setActiveProjectId(project.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
              activeProjectId === project.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {project.name}
          </button>
        ))}
        <Button
          onClick={onAddProject}
          variant="ghost"
          size="icon"
          className="rounded-full w-8 h-8"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  )
}

export default ProjectTabs
