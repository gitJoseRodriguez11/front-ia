import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AiChatService } from './ai-chat.service';

type Role = 'user' | 'assistant';

interface ChatMessage {
  role: Role;
  text: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  prompt = 'cuales son los servicios de la sucursal de viña';
  sessionId = 'sssss';
  isLoading = false;

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Hola, escribe tu consulta y la enviaré al servicio /queryWithDataV2.'
    }
  ];

  constructor(private readonly aiChatService: AiChatService) {}

 send(): void {
  const cleanedPrompt = this.prompt.trim();
  const cleanedSessionId = this.sessionId.trim();

  if (!cleanedPrompt || !cleanedSessionId || this.isLoading) {
    return;
  }

  this.messages.push({ role: 'user', text: cleanedPrompt });
  this.isLoading = true;

  this.aiChatService
    .sendMessage({ prompt: cleanedPrompt, sessionId: cleanedSessionId })
    .pipe(finalize(() => (this.isLoading = false)))
    .subscribe({
      next: (response: string) => {
        // Como el backend devuelve texto plano, lo usamos directamente
        this.messages.push({
          role: 'assistant',
          text: response
        });
        this.prompt = '';
      },
      error: (err) => {
        console.error('Error en la llamada:', err);
        this.messages.push({
          role: 'assistant',
          text: 'No se pudo conectar con el servicio. Revisa que el backend esté activo en http://localhost:5000.'
        });
      }
    });
}


  trackByIndex(index: number): number {
    return index;
  }

  private extractText(response: unknown): string {
    if (response === null || response === undefined) {
      return 'Respuesta vacia del servicio.';
    }

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object') {
      const maybeText = (response as Record<string, unknown>)['response'];

      if (typeof maybeText === 'string' && maybeText.trim()) {
        return maybeText;
      }

      return JSON.stringify(response, null, 2);
    }

    return String(response);
  }
}
