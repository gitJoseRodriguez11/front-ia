import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatRequest {
  prompt: string;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly apiUrl = 'http://localhost:5000/api/ai/queryWithDataV2';

  constructor(private readonly http: HttpClient) {}

  sendMessage(payload: ChatRequest): Observable<string> {
    return this.http.post(this.apiUrl, payload, { responseType: 'text' });
  }
}
