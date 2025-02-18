import bcrypt from "bcryptjs";

export const crypto = {
  hash: async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  compare: async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
  },

  generateEventId: () => {
    // Generate a random 8-digit number
    return Math.floor(10000000 + Math.random() * 90000000);
  }
};