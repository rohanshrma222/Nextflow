import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function getPrimaryEmail(data: {
  primary_email_address_id?: string | null
  email_addresses?: Array<{ id: string; email_address: string }>
}) {
  return data.email_addresses?.find(
    (email) => email.id === data.primary_email_address_id,
  )?.email_address
}

export async function POST(req: NextRequest) {
  try {
    const event = await verifyWebhook(req)

    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const user = event.data

        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: getPrimaryEmail(user) ?? null,
            firstName: user.first_name ?? null,
            lastName: user.last_name ?? null,
            imageUrl: user.image_url ?? null,
          },
          create: {
            id: user.id,
            email: getPrimaryEmail(user) ?? null,
            firstName: user.first_name ?? null,
            lastName: user.last_name ?? null,
            imageUrl: user.image_url ?? null,
          },
        })

        break
      }
      case 'user.deleted': {
        if (event.data.id) {
          await prisma.user.delete({
            where: { id: event.data.id },
          }).catch(() => null)
        }

        break
      }
      default:
        break
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error verifying Clerk webhook', error)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
