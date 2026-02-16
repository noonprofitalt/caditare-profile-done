import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Validation middleware and schemas
 */

// UUID validation schema
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

// Message validation schema
export const messageSchema = Joi.object({
    text: Joi.string().min(1).max(10000).required(),
    parentMessageId: uuidSchema.optional(),
});

// Channel creation schema
export const channelSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid('public', 'private', 'system').required(),
    contextType: Joi.string().valid('candidate', 'employer', 'task').optional(),
    contextId: uuidSchema.when('contextType', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
});

// Channel update schema
export const channelUpdateSchema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
});

// File upload validation
export const fileUploadSchema = Joi.object({
    messageId: uuidSchema.required(),
});

// Add members schema
export const addMembersSchema = Joi.object({
    userIds: Joi.array().items(uuidSchema).min(1).max(50).required(),
});

// Reaction schema
export const reactionSchema = Joi.object({
    emoji: Joi.string().min(1).max(10).required(),
});

/**
 * Validation middleware factory
 */
export function validate(schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body') {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors,
            });
        }

        // Replace request data with validated and sanitized data
        req[property] = value;
        next();
    };
}

/**
 * UUID parameter validation middleware
 */
export function validateUuidParam(paramName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = uuidSchema.validate(req.params[paramName]);

        if (error) {
            return res.status(400).json({
                error: `Invalid ${paramName}`,
                message: 'Must be a valid UUID',
            });
        }

        next();
    };
}
