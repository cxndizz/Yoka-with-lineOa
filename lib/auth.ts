import { prisma } from './prisma';

export async function findOrCreateMemberFromLineProfile(profile: {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  email?: string;
}) {
  let member = await prisma.member.findUnique({
    where: { lineUserId: profile.lineUserId },
  });

  if (!member) {
    member = await prisma.member.create({
      data: {
        lineUserId: profile.lineUserId,
        lineDisplayName: profile.displayName,
        linePictureUrl: profile.pictureUrl,
        email: profile.email,
      },
    });
  } else {
    member = await prisma.member.update({
      where: { id: member.id },
      data: {
        lineDisplayName: profile.displayName ?? member.lineDisplayName,
        linePictureUrl: profile.pictureUrl ?? member.linePictureUrl,
        email: profile.email ?? member.email,
      },
    });
  }

  return member;
}
