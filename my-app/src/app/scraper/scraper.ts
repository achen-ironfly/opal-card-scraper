import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-scraper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scraper.html',
  styleUrls: ['./scraper.css']
})
export class Scraper {
  username = '';
  password = '';
  startDate: string | null = null;
  endDate: string | null = null;
  showBrowser = true;
  running = false;
  message: string | null = null;
  messageType: 'info' | 'error' = 'info';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private zone: NgZone) {}

  async run() {
    if (!this.username || !this.password) {
      this.showMessage('Please enter username and password.', 'error');
      return;
    }
    // Validate & normalize dates: allow empty; accept MM-DD-YYYY or MM/DD/YYYY; normalize to MM-DD-YYYY
    const isEmpty = (s: string | null | undefined) => !s || s.trim() === '';
    const normalizeDate = (s: string): string | null => {
      const raw = s.trim().replace(/\//g, '-');
      // Accept single-digit month/day and pad to two digits
      const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(raw);
      if (!m) return null;
      let mm = parseInt(m[1], 10);
      let dd = parseInt(m[2], 10);
      const yyyy = parseInt(m[3], 10);
      if (mm < 1 || mm > 12) return null;
      if (dd < 1 || dd > 31) return null;
      const d = new Date(yyyy, mm - 1, dd);
      if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(mm)}-${pad(dd)}-${yyyy}`;
    };

    if (!isEmpty(this.startDate)) {
      const norm = normalizeDate(this.startDate as string);
      if (!norm) {
        this.showMessage('Start date must be in valid format', 'error');
        return;
      }
      // Future date check for start date
      const [mmS, ddS, yyyyS] = norm.split('-').map((v) => parseInt(v, 10));
      const start = new Date(yyyyS, mmS - 1, ddS);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start.getTime() > today.getTime()) {
        this.showMessage('Start date cannot be in the future', 'error');
        return;
      }
      this.startDate = norm;
    }
    if (!isEmpty(this.endDate)) {
      const norm = normalizeDate(this.endDate as string);
      if (!norm) {
        this.showMessage('End date must be in valid format', 'error');
        return;
      }
      // Future date check for end date
      const [mmE, ddE, yyyyE] = norm.split('-').map((v) => parseInt(v, 10));
      const end = new Date(yyyyE, mmE - 1, ddE);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (end.getTime() > today.getTime()) {
        this.showMessage('End date cannot be in the future', 'error');
        return;
      }
      this.endDate = norm;
    }
    this.running = true;
    try {
      const payload = {
        username: this.username.trim(),
        password: this.password,
        startDate: this.startDate || null,
        endDate: this.endDate || null,
        showBrowser: !!this.showBrowser
      };

      const rawResp = await lastValueFrom(this.http.post('/api/scrape', payload, { observe: 'response', responseType: 'blob' } as any));
      const resp = rawResp as unknown as HttpResponse<Blob>;
      if (!resp) {
        this.showMessage('No response from server', 'error');
        return;
      }
      // Extract blob and filename from headers
      const blob = resp.body as Blob;
      // Default filename
      let filename = 'transactions.json';
      const cd = resp.headers?.get('Content-Disposition') || resp.headers?.get('content-disposition');
      if (cd) {
        const match = /filename\s*=\s*"?([^";]+)"?/i.exec(cd);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      try {
        // Detect invalid credentials (401) and show a friendly message
        if (e?.status === 401) {
          this.showMessage('Please enter the correct username or password.', 'error');
        } else {
          const txt = await (e?.error?.text ? e.error.text() : Promise.resolve(String(e)));
          const msg = (txt || e?.message || e);
          if (typeof msg === 'string' && /Invalid\s*credentials/i.test(msg)) {
            this.showMessage('Please enter the correct username or password.', 'error');
          } else {
            this.showMessage('Error: ' + msg, 'error');
          }
        }
      } catch (_) {
        if (e?.status === 401) {
          this.showMessage('请输入正确的用户名或密码', 'error');
        } else {
          this.showMessage('Request failed: ' + (e?.message || e), 'error');
        }
      }
    } finally {
      // Ensure UI updates even if outside Angular zone (e.g., after file download)
      this.zone.run(() => {
        this.running = false;
        this.cdr.detectChanges();
      });
    }
  }

  private showMessage(msg: string, type: 'info' | 'error' = 'info', autoClearMs = 5000) {
    this.messageType = type;
    this.message = msg;
    if (autoClearMs > 0) {
      window.clearTimeout((this as any)._msgTimer);
      (this as any)._msgTimer = window.setTimeout(() => {
        this.message = null;
        this.cdr.detectChanges();
      }, autoClearMs);
    }
  }
}
