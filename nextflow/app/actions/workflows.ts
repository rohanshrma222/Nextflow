'use server'

import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import type { Edge, Node } from 'reactflow'
import prisma from '@/lib/prisma'
import { ensureDbUser } from '@/lib/db-user'
import { getSampleWorkflow } from '@/lib/sampleWorkflow'

interface SaveWorkflowInput {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
}

export interface SavedWorkflowData {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  updatedAt: Date
  createdAt: Date
}

function toPrismaJson(value: Node[] | Edge[]): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

export async function createWorkflow(name = 'Untitled') {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await ensureDbUser(userId)

    const workflow = await prisma.workflow.create({
      data: {
        user: {
          connect: { id: userId },
        },
        name: name.trim() || 'Untitled',
        nodes: [],
        edges: [],
      },
    })

    return { success: true, id: workflow.id }
  } catch (error) {
    console.error('Failed to create workflow:', error)
    return { success: false, error: 'Failed to create workflow' }
  }
}

export async function createSampleWorkflow() {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await ensureDbUser(userId)

    const sample = getSampleWorkflow()

    const workflow = await prisma.workflow.create({
      data: {
        user: {
          connect: { id: userId },
        },
        name: sample.name,
        nodes: toPrismaJson(sample.nodes),
        edges: toPrismaJson(sample.edges),
      },
    })

    return { success: true, id: workflow.id }
  } catch (error) {
    console.error('Failed to create sample workflow:', error)
    return { success: false, error: 'Failed to create sample workflow' }
  }
}

export async function saveWorkflow(data: SaveWorkflowInput) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await ensureDbUser(userId)

    const workflow = await prisma.workflow.update({
      where: {
        id: data.id,
        userId,
      },
      data: {
        name: data.name.trim() || 'Untitled',
        nodes: toPrismaJson(data.nodes),
        edges: toPrismaJson(data.edges),
      },
    })

    return { success: true, id: workflow.id, updatedAt: workflow.updatedAt }
  } catch (error) {
    console.error('Failed to save workflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save workflow',
    }
  }
}

export async function listWorkflows(): Promise<SavedWorkflowData[]> {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await ensureDbUser(userId)

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      nodes: workflow.nodes as unknown as Node[],
      edges: workflow.edges as unknown as Edge[],
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }))
  } catch (error) {
    console.error('Failed to list workflows:', error)
    return []
  }
}

export async function loadWorkflowById(
  workflowId: string,
): Promise<SavedWorkflowData | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await ensureDbUser(userId)

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId,
      },
    })

    if (!workflow) {
      return null
    }

    return {
      id: workflow.id,
      name: workflow.name,
      nodes: workflow.nodes as unknown as Node[],
      edges: workflow.edges as unknown as Edge[],
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }
  } catch (error) {
    console.error('Failed to load workflow:', error)
    return null
  }
}
