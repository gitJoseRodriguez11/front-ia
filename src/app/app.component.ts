import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
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
export class AppComponent implements AfterViewChecked {
  prompt = 'Necesito agendar una hora';
  sessionId = this.generateSessionId();
  isLoading = false;
  private shouldScrollToBottom = false;

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLElement>;

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: '🤖 ¡Hola! Soy MIA, tu compañera digital. Estoy lista para conversar contigo y ayudarte en lo que necesites. Cuéntame, ¿qué te gustaría preguntar?'
    }
  ];

  constructor(private readonly aiChatService: AiChatService) {}

  ngAfterViewChecked(): void {
    if (!this.shouldScrollToBottom) {
      return;
    }

    const container = this.messagesContainer?.nativeElement;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
    this.shouldScrollToBottom = false;
  }

  send(): void {
    const cleanedPrompt = this.prompt.trim();

    if (!cleanedPrompt || this.isLoading) {
      return;
    }

    this.messages.push({ role: 'user', text: cleanedPrompt });
    this.prompt = '';
    this.isLoading = true;
    this.requestScrollToBottom();

    this.aiChatService
      .sendMessage({ prompt: cleanedPrompt, sessionId: this.sessionId })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: string) => {
          this.messages.push({
            role: 'assistant',
            text: response
          });
          if (this.isAppointmentBooked(response)) {
            this.sessionId = this.generateSessionId();
          }
          this.requestScrollToBottom();
        },
        error: (err) => {
          console.error('Error en la llamada:', err);
          this.messages.push({
            role: 'assistant',
            text: 'No se pudo conectar con el servicio. Revisa que el backend esté activo en http://localhost:5000.'
          });
          this.requestScrollToBottom();
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

  private requestScrollToBottom(): void {
    this.shouldScrollToBottom = true;
  }

  private isAppointmentBooked(response: string): boolean {
    const lower = response.toLowerCase();
    return lower.includes('cita agendada exitosamente') ||
           lower.includes('cita fue agendada exitosamente') ||
           lower.includes('su cita ha sido agendada') ||
           lower.includes('tu cita ha sido agendada') ||
           lower.includes('cita confirmada') ||
           lower.includes('agendamiento exitoso');
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
