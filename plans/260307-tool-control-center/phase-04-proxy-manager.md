# Phase 04: Proxy Manager

## Objective
Tích hợp Webshare API, fetch proxy, format thành `http://user:pass@ip:port`, ghi vào tất cả tool folders.

## Tasks

### 4.1 Webshare Service (`server/services/proxy-manager.ts`)

**Fetch proxies:**
```
GET https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page_size=100
Headers: Authorization: Token <WEBSHARE_API_KEY>

Response: {
  count: number,
  results: [{
    proxy_address: string,  // IP
    port: number,
    username: string,
    password: string,
    valid: boolean,
    country_code: string
  }]
}
```

**Format output:**
```
http://username:password@proxy_address:port
```

Mỗi proxy 1 dòng, ghi vào file.

### 4.2 Apply Proxy to All Tools

**Logic:**
```
For each tool in scanned tools:
  if tool has proxy.txt → write formatted proxies
  if tool has proxies.txt → write formatted proxies (same content)
```

**Safety:**
- Backup old proxy file trước khi ghi (proxy.txt.bak)
- Report: bao nhiêu tool updated, bao nhiêu failed
- Option: restart tools sau khi update proxy

### 4.3 API Routes (`server/routes/proxy.ts`)
- GET `/api/proxy/current` — đọc proxy hiện tại từ master list
- POST `/api/proxy/fetch` — fetch fresh từ Webshare API
- POST `/api/proxy/apply-all` — ghi proxy vào tất cả tools
- POST `/api/proxy/fetch-and-apply` — fetch + apply + optional restart

### 4.4 Pagination handling
- Webshare default page_size=25, max=100
- Nếu có >100 proxy → loop qua pages
- Combine all results → format → write

## Definition of Done
- [ ] Fetch proxy từ Webshare API thành công
- [ ] Format đúng: `http://user:pass@ip:port`
- [ ] Ghi vào cả `proxy.txt` và `proxies.txt` trong mọi tool folder
- [ ] Backup file cũ trước khi ghi
- [ ] API trả về report (updated count, failed count)
- [ ] Handle pagination nếu >100 proxies
- [ ] Handle API errors gracefully (rate limit, auth fail)
