# Connecting a Custom Domain in Yandex Cloud (YC)

To connect a custom domain to your Serverless Container project, follow these steps:

## 1. Issue an SSL Certificate
Use Yandex Certificate Manager to get a free Let's Encrypt® certificate.
1. Go to **Certificate Manager** in the YC Console.
2. Click **Create** -> **Let's Encrypt® certificate**.
3. Enter your domain name (e.g., `app.bizmusic.ru`).
4. Follow the validation steps (usually by adding a TXT record to your DNS).

## 2. Create an API Gateway
API Gateway is the recommended entry point for Serverless Containers with custom domains.
1. Go to **API Gateway** in the YC Console.
2. Click **Create API Gateway**.
3. Name it `bizmusic-gateway`.
4. In the **Specification** (OpenAPI 3.0), define an extension to route to your container.

Example snippet for a robust specification that handles all routes and methods (Next.js needs this):
```yaml
openapi: 3.0.0
info:
  title: BizMusic API
  version: 1.0.0
paths:
  /:
    x-yc-apigateway-any-method:
      x-yc-apigateway-integration:
        type: serverless_containers
        container_id: <YOUR_CONTAINER_ID>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
  /{proxy+}:
    x-yc-apigateway-any-method:
      parameters:
        - name: proxy
          in: path
          required: true
          schema:
            type: string
      x-yc-apigateway-integration:
        type: serverless_containers
        container_id: <YOUR_CONTAINER_ID>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
```
*(Note: Replace `<YOUR_CONTAINER_ID>` and `<YOUR_SERVICE_ACCOUNT_ID>` with your actual IDs.)*

## 3. Attach Custom Domain to API Gateway
1. Open your created **API Gateway**.
2. Go to the **Custom Domains** tab.
3. Click **Add Domain**.
4. Select your certificate and enter the domain name.
5. YC will provide a **CNAME** target (e.g., `d5d...apigw.yandexcloud.net`).

## 4. Update DNS Records
1. Go to your DNS provider (e.g., Reg.ru, Cloudflare, or Yandex Cloud DNS).
2. Create a **CNAME record**:
   - **Host/Name**: `app` (or your subdomain)
   - **Value/Target**: The CNAME target provided by YC API Gateway.

## 5. Wait for Propagation
DNS changes can take from 30 minutes to a few hours. Once propagated, your PWA will be accessible at your custom domain via HTTPS.

---

---

## Troubleshooting 404 Errors

If you get a 404 error when accessing your domain or the API Gateway URL:

### 1. Check Service Account Permissions
The service account used in the API Gateway needs the `serverless.containers.invoker` role to call your container.
- Go to **IAM & Admin** in the YC Console.
- Find your service account.
- Ensure it has the `serverless.containers.invoker` role in the folder.

### 2. Verify Container Visibility
If the container is not **Public**, it can ONLY be accessed by authorized users or services (like the API Gateway with a service account).
- Go to **Serverless Containers** -> `bizmusic`.
- In the **Overview** tab, check the **Public** toggle.
- If it's **Off**, ensure the API Gateway spec has the correct `service_account_id`.

### 3. Check Container Logs
The container might be crashing on startup or failing to handle the request.
- Go to **Serverless Containers** -> `bizmusic`.
- Click on the **Logs** tab.
- Look for messages like `Listening on port 3000` or any error stack traces.

### 4. Direct Container URL Test
Test the direct container URL provided by YC (e.g., `https://bba...containers.yandexcloud.net`).
- If this works but the API Gateway doesn't, the issue is in the **API Gateway Specification** or **Permissions**.
- If this ALSO returns 404, the issue is in the **Container** or its **Routing**.

### 5. Next.js Routing
Ensure your Next.js app is configured correctly for standalone mode.
- In `next.config.ts`, you should have `output: 'standalone'`.
- Our current configuration already has this, but if you've changed it, it might affect how YC handles the application.
