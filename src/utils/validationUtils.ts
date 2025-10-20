export function parseArrayField(field: any): any[] {
  if (!field) return [];
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [field];
    }
  }
  return Array.isArray(field) ? field : [field];
}

export function validatePrice(price: any): { valid: boolean; error?: string; value?: number } {
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return { valid: false, error: 'Invalid price value' };
  }
  return { valid: true, value: parsedPrice };
}

export function validateQuantity(quantity: any): { valid: boolean; error?: string; value?: number } {
  const parsedQuantity = parseInt(quantity);
  if (isNaN(parsedQuantity) || parsedQuantity < 0) {
    return { valid: false, error: 'Invalid quantity value' };
  }
  return { valid: true, value: parsedQuantity };
}

export function validateFileType(file: any, allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
  }
  return { valid: true };
}

export function validateFileSize(file: any, maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return { valid: false, error: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB` };
  }
  return { valid: true };
}

export function validateImageFiles(files: any[], maxCount: number = 4): { valid: boolean; error?: string } {
  if (!files || files.length === 0) {
    return { valid: false, error: 'At least one image is required' };
  }

  if (files.length > maxCount) {
    return { valid: false, error: `Maximum ${maxCount} images allowed` };
  }

  for (const file of files) {
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) return typeValidation;

    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) return sizeValidation;
  }

  return { valid: true };
}
