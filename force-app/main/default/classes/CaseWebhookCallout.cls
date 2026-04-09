public class CaseWebhookCallout implements Queueable, Database.AllowsCallouts {

    private String caseId;
    private String caseNumber;

    public CaseWebhookCallout(String caseId, String caseNumber) {
        this.caseId = caseId;
        this.caseNumber = caseNumber;
    }

    @InvocableMethod(
        label='Send Case to Make Webhook'
        description='Sends Case Id and Case Number to a Make (Integromat) webhook'
    )
    public static void sendCaseToWebhook(List<CaseWebhookRequest> requests) {
        for (CaseWebhookRequest req : requests) {
            System.enqueueJob(new CaseWebhookCallout(req.caseId, req.caseNumber));
        }
    }

    public void execute(QueueableContext context) {
        String webhookUrl = Label.Make_Webhook_URL;

        Map<String, String> payload = new Map<String, String>{
            'caseId'     => caseId,
            'caseNumber' => caseNumber
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint(webhookUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(payload));
        req.setTimeout(10000);

        Http http = new Http();
        http.send(req);
    }

    public class CaseWebhookRequest {
        @InvocableVariable(label='Case ID' required=true)
        public String caseId;

        @InvocableVariable(label='Case Number' required=true)
        public String caseNumber;
    }
}
