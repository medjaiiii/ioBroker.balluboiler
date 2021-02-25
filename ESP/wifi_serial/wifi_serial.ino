#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>

#define MAX_SRV_CLIENTS 10
#define LED     12


const char* ssid = "*******";
const char* password = "********";

WiFiServer server(23);
WiFiClient serverClients[MAX_SRV_CLIENTS];

int cn = 0;

void setup() {
 Serial.begin(9600);
 delay(10);
 pinMode(LED, OUTPUT);
 Serial.println();
 Serial.println();
 Serial.print("Connecting to ");
 Serial.println(ssid);
  setup_wifi();
  
  server.begin();
  server.setNoDelay(true);
  ArduinoOTA.setHostname("esp_telnet");
  ArduinoOTA.onStart([]() {  });
  ArduinoOTA.onEnd([]() {  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {  });
  ArduinoOTA.onError([](ota_error_t error) {  });
  ArduinoOTA.begin();
}

void setup_wifi() {
  delay(10);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  reconnect();
  Serial.println(WiFi.localIP());
}

void reconnect() {
  digitalWrite(LED, !digitalRead(LED));
  while (WiFi.status() != WL_CONNECTED) {
    cn++;
    delay(200);
    ArduinoOTA.handle();
    digitalWrite(LED, !digitalRead(LED));
    if (cn > 200){ESP.restart();}
  }
  digitalWrite(LED, HIGH);
}

void loop() {
  uint8_t i;
  ArduinoOTA.handle();
  if(WiFi.status() != WL_CONNECTED){
    reconnect();
  }
  //check if there are any new clients
  if (server.hasClient()){
    for(i = 0; i < MAX_SRV_CLIENTS; i++){
      //find free/disconnected spot
      if (!serverClients[i] || !serverClients[i].connected()){
        if(serverClients[i]) serverClients[i].stop();
        serverClients[i] = server.available();
        //continue;
        break;
      }
    }
    //no free/disconnected spot so reject
    //WiFiClient serverClient = server.available();
    //serverClient.stop();
    if (i == MAX_SRV_CLIENTS) {
      WiFiClient serverClient = server.available();
      serverClient.stop();
      ESP.restart();
    }
  }
  //check clients for data
  for(i = 0; i < MAX_SRV_CLIENTS; i++){
    if (serverClients[i] && serverClients[i].connected()){
      if(serverClients[i].available()){
        //get data from the telnet client and push it to the UART
        while(serverClients[i].available()) Serial.write(serverClients[i].read());
      }
    }
  }
  //check UART for data
  if(Serial.available()){
    size_t len = Serial.available();
    uint8_t sbuf[len];
    Serial.readBytes(sbuf, len);
    //push UART data to all connected telnet clients
    for(i = 0; i < MAX_SRV_CLIENTS; i++){
      if (serverClients[i] && serverClients[i].connected()){
        serverClients[i].write(sbuf, len);
        delay(1);
      }
    }
  }
}
