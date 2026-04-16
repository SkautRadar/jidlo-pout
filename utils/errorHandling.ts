/**
 * Centralized Error Logging and Handling Utilities
 * 
 * Provides consistent error handling across the application
 * with support for different error types and severity levels.
 */

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface AppError {
    message: string;
    code?: string;
    severity: ErrorSeverity;
    timestamp: Date;
    context?: Record<string, any>;
    originalError?: Error;
}

class ErrorLogger {
    private errors: AppError[] = [];
    private maxErrors = 100; // Keep last 100 errors in memory

    /**
     * Log an error with context
     */
    log(error: Error | string, severity: ErrorSeverity = ErrorSeverity.MEDIUM, context?: Record<string, any>): void {
        const appError: AppError = {
            message: typeof error === 'string' ? error : error.message,
            severity,
            timestamp: new Date(),
            context,
            originalError: error instanceof Error ? error : undefined
        };

        // Add to in-memory store
        this.errors.push(appError);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift(); // Remove oldest
        }

        // Console logging based on severity
        if (process.env.NODE_ENV === 'development') {
            const consoleMethod = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH
                ? console.error
                : console.warn;

            consoleMethod(
                `[${severity.toUpperCase()}] ${appError.message}`,
                context || '',
                error instanceof Error ? error.stack : ''
            );
        }

        // TODO: Send to external service in production
        // if (process.env.NODE_ENV === 'production') {
        //   this.sendToSentry(appError);
        // }
    }

    /**
     * Get recent errors (useful for debugging)
     */
    getRecentErrors(count: number = 10): AppError[] {
        return this.errors.slice(-count);
    }

    /**
     * Clear error log
     */
    clear(): void {
        this.errors = [];
    }

    /**
     * Export errors as JSON (for support/debugging)
     */
    export(): string {
        return JSON.stringify(this.errors, null, 2);
    }

    // TODO: Integration with external services
    // private sendToSentry(error: AppError): void {
    //   // Sentry.captureException(error.originalError || error.message, {
    //   //   level: error.severity,
    //   //   extra: error.context
    //   // });
    // }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * User-friendly error messages for common scenarios
 */
export const getUserFriendlyMessage = (error: any): string => {
    // Network errors
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
        return 'Problém s připojením k internetu. Zkuste to prosím znovu.';
    }

    // Supabase auth errors
    if (error?.code === 'PGRST301') {
        return 'Přihlášení selhalo. Zkontrolujte email a heslo.';
    }

    // Database errors
    if (error?.code?.startsWith('P')) {
        return 'Chyba databáze. Kontaktujte podporu pokud problém přetrvává.';
    }

    // Validation errors
    if (error?.message?.includes('validation') || error?.message?.includes('required')) {
        return 'Některé údaje nejsou vyplněny správně. Zkontrolujte formulář.';
    }

    // Generic fallback
    return error?.message || 'Nastala neočekávaná chyba. Zkuste to prosím znovu.';
};

/**
 * Async error handler wrapper
 * Usage: await handleAsyncError(() => someAsyncFunction())
 */
export const handleAsyncError = async <T>(
    fn: () => Promise<T>,
    errorMessage?: string
): Promise<{ data: T | null; error: AppError | null }> => {
    try {
        const data = await fn();
        return { data, error: null };
    } catch (err) {
        const error: AppError = {
            message: errorMessage || getUserFriendlyMessage(err),
            severity: ErrorSeverity.MEDIUM,
            timestamp: new Date(),
            originalError: err instanceof Error ? err : undefined
        };

        errorLogger.log(err as Error, error.severity);

        return { data: null, error };
    }
};

/**
 * Custom Error Types
 */
export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string = 'Uživatel není přihlášen') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class PermissionError extends Error {
    constructor(message: string = 'Nedostatečná oprávnění') {
        super(message);
        this.name = 'PermissionError';
    }
}

export class NetworkError extends Error {
    constructor(message: string = 'Chyba síťového připojení') {
        super(message);
        this.name = 'NetworkError';
    }
}
