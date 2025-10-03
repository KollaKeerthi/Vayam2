# Email System Documentation

This document describes the email system implemented for the Vayam platform, including templates, utilities, and usage examples.

## Overview

The email system consists of:
- **Email utility** (`/src/utils/email.ts`) - Core email sending functionality
- **Template processor** (`/src/utils/email-templates.ts`) - Template rendering and email helpers
- **HTML templates** (`/src/templates/`) - Professional email templates

## Email Templates

### 1. SME Invitation (`sme-invitation.html`)
Used to invite Subject Matter Experts to contribute to private questions.

**Template Variables:**
- `questionTitle` - The title of the question
- `questionId` - Unique question identifier
- `questionDescription` - Optional question description
- `questionUrl` - Direct link to the question
- `platformUrl` - Main platform URL
- `supportUrl` - Support page URL
- `unsubscribeUrl` - Unsubscribe link

### 2. Welcome Email (`welcome.html`)
Sent to new users when they join the platform.

**Template Variables:**
- `userName` - Name of the new user
- `platformUrl` - Main platform URL

### 3. New Solution Notification (`new-solution-notification.html`)
Notifies users when new solutions are added to questions they're following.

**Template Variables:**
- `questionTitle` - The title of the question
- `questionUrl` - Direct link to the question
- `solutionAuthor` - Name of the solution author
- `solutionPreview` - Brief preview of the solution
- `unsubscribeUrl` - Unsubscribe link

## Usage Examples

### Basic Email Sending

```typescript
import { sendEmail } from '@/utils/email';

const result = await sendEmail(
  'user@example.com',
  'Subject Line',
  '<h1>HTML Content</h1>',
  true // isHtml
);

if (result.success) {
  console.log('Email sent successfully:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Using Email Templates

```typescript
import { EmailTemplateProcessor } from '@/utils/email-templates';

const templateData = {
  questionTitle: 'How to optimize React performance?',
  questionId: 123,
  questionUrl: 'https://platform.com/questions/123',
  platformUrl: 'https://platform.com'
};

const htmlContent = await EmailTemplateProcessor.renderTemplate(
  'sme-invitation',
  templateData
);

const result = await sendEmail(
  'expert@example.com',
  'SME Invitation',
  htmlContent,
  true
);
```

### Using Email Notifications Helper

```typescript
import { EmailNotifications } from '@/utils/email-templates';

// Send SME invitation
const result = await EmailNotifications.sendSMEInvitation(
  'expert@example.com',
  {
    questionTitle: 'How to optimize React performance?',
    questionId: 123,
    questionUrl: 'https://platform.com/questions/123',
    platformUrl: 'https://platform.com'
  }
);

// Send welcome email
const welcomeResult = await EmailNotifications.sendWelcomeEmail(
  'newuser@example.com',
  {
    userName: 'John Doe',
    platformUrl: 'https://platform.com'
  }
);
```

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
SENDER_EMAIL=your-email@gmail.com
SENDER_PASS=your-app-password
NEXTAUTH_URL=https://your-platform.com
```

## Template System Features

### Variable Substitution
Templates use `{{variableName}}` syntax for variable substitution.

### Conditional Blocks
Templates support conditional rendering:
```html
{{#if questionDescription}}
<div>{{questionDescription}}</div>
{{/if}}
```

### Caching
Templates are automatically cached after first load for better performance.

## API Integration

### SME Invitation API (`/api/invite-sme`)
Sends email invitations to multiple SMEs for a specific question.

**Request Body:**
```json
{
  "emails": ["expert1@example.com", "expert2@example.com"],
  "questionTitle": "Question title",
  "questionId": 123,
  "questionDescription": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitations sent successfully to 2 SME(s)"
}
```

## Error Handling

The email system includes comprehensive error handling:
- Email configuration validation
- SMTP connection verification
- Individual email failure tracking
- Detailed error messages

## Performance Considerations

- Templates are cached in memory after first load
- Email sending is done asynchronously
- Batch email operations return detailed success/failure stats
- Template processing is optimized for speed

## Future Enhancements

Potential improvements to consider:
- Email queue system for high-volume sending
- Email analytics and tracking
- Rich text editor for custom templates
- Multilingual template support
- Email scheduling functionality