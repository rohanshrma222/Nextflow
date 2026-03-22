'use server'

import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { ensureDbUser } from '@/lib/db-user'
import { WorkflowRun } from '@/types'

export async function fetchRuns() {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await ensureDbUser(userId)

    const runs = await prisma.workflowRun.findMany({
      where: { userId },
      include: { nodeResults: true },
      orderBy: { timestamp: 'desc' },
    })
    
    return runs.map((run) => ({
      id: run.id,
      timestamp: run.timestamp,
      scope: run.scope as 'full' | 'partial' | 'single',
      scopeLabel: run.scopeLabel,
      status: run.status as 'success' | 'failed' | 'running',
      durationMs: run.durationMs,
      nodeResults: run.nodeResults.map((nr) => ({
        nodeId: nr.nodeId,
        nodeName: nr.nodeName,
        status: nr.status as 'success' | 'failed' | 'running',
        durationMs: nr.durationMs,
        output: nr.output || undefined,
        error: nr.error || undefined,
      }))
    }))
  } catch (error) {
    console.error('Failed to fetch runs:', error)
    return []
  }
}

export async function saveRun(data: Omit<WorkflowRun, 'id'>) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await ensureDbUser(userId)

    const newRun = await prisma.workflowRun.create({
      data: {
        user: {
          connect: { id: userId },
        },
        timestamp: data.timestamp,
        scope: data.scope,
        scopeLabel: data.scopeLabel,
        status: data.status,
        durationMs: data.durationMs,
        nodeResults: {
          create: data.nodeResults.map(nr => ({
            nodeId: nr.nodeId,
            nodeName: nr.nodeName,
            status: nr.status,
            durationMs: nr.durationMs,
            output: nr.output,
            error: nr.error
          }))
        }
      },
      include: { nodeResults: true }
    })
    return { success: true, id: newRun.id }
  } catch (error) {
    console.error('Failed to save run:', error)
    return { success: false }
  }
}
