import omise from 'omise';

if (!process.env.OMISE_SECRET_KEY || !process.env.OMISE_PUBLIC_KEY) {
  console.warn('OMISE keys are not set. Payments will not work until configured.');
}

export const omiseClient = omise({
  publicKey: process.env.OMISE_PUBLIC_KEY || '',
  secretKey: process.env.OMISE_SECRET_KEY || '',
});
