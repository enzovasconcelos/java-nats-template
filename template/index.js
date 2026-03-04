import { File, Text } from '@asyncapi/generator-react-sdk';
//import { importModels } from '../../components/util';

function toPascalCase(name) {
    let firstLetter = name[0];
    return name.replace(firstLetter, firstLetter.toUpperCase());
} 

function getMethodName(channelName) {
    let out = channelName.replaceAll("{", "");
    out = out.replaceAll("}", "");
    out = out.replaceAll("/", "");
    return out;
}

function getParametersList(parameters) {
    let out = "";
    for(let paramName in parameters) {
        out = toPascalCase(parameters[paramName].schema().type());
        out += " " + paramName;
    }
    return out;
}

function getChannelWrappers(asyncapi, params) {
    console.log(params);
    let channelWrappers = []; 
    let channelEntries = Object.keys(asyncapi.channels()).length ? Object.entries(asyncapi.channels()) : [];
    console.log(channelEntries);
    let out = "";
    for(let [channelName, channel] of channelEntries) {
        console.log(channelName);
        console.log(channel);
        const methodName = getMethodName(channelName);
        let parametersList = getParametersList(channel.parameters());
        if(channel.subscribe()) {
            out += `
    public Subscription subscribeOn${methodName}(${parametersList}) {
        if(!isConnected()) {
            throw new Exception("Client not connected");
        }
        String subject = "${channelName}";
        this.connection.subscribe(subject);
    }
`;
            console.log(`Esse channel ${channelName} é do tipo subscribe`);
        } else if(channel.publish()) {
            console.log(`Esse channel ${channelName} é do tipo publish`);
            let argumentsList = parametersList;
            argumentsList += parametersList ? ", " : "";
            argumentsList += "Byte[] message";
            out += `
    public void publishOn${methodName}(${argumentsList}) {
        if(!isConnected()) {
            throw new Exception("Client not connected");
        }
        String subject = "${channelName}";
        this.connection.publish(subject, message);
    }            
`;
        }
    }
    channelWrappers = channelEntries.map(([channelName, channel]) => {
        const publishMessage = channel.publish() ? channel.publish().message(0) : undefined;
        const subscribeMessage = channel.subscribe() ? channel.subscribe().message(0) : undefined;
        const channelDescription = channel.description();
        const channelParameters = channel.parameters(); 
        if(publishMessage) {
            console.log('--- publish ---');
        } else if(subscribeMessage) {
            console.log('--- subscribe ---');

        }
        console.log(`publish msg: ${publishMessage}`);
        console.log(`subscribe msg: ${subscribeMessage}`);
        console.log(`description: ${channelDescription}`);
        console.log(`parameters: ${channelParameters}`);
        for(let parameterName in channelParameters) {
            console.log('parameter name: ', parameterName);
            console.log(channelParameters[parameterName].schema().type());
        }
    });
    return out;
}

function formatClassName(title) {
    return `${title.replace(" ", "")}Client.java`;
}

export default function ({ asyncapi, params }) {
  const className = formatClassName(asyncapi.info().title());
  return (
    <File name={className}>
{`
// TODO: define your package
// package asyncapi.nats.client;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.time.Duration;

import asyncapi.nats.models.*;

import io.nats.client.Connection;
import io.nats.client.Message;
import io.nats.client.Nats;
import io.nats.client.Subscription;

public class ${asyncapi.info().title().replace(" ", "")}Client {
    
    private Connection connection;    

    public void connect() {
        connection = Nats.connect();
    }

    public void connect(String url) {
        connection = Nats.connect(url);
    }
    
    public void disconnect() {
        this.connection.close();
    }
    
    public boolean isConnected() {
        return this.connection != null && this.connection.getStatus() == Connection.Status.CONNECTED;
    }
    ${getChannelWrappers(asyncapi, params)}
}
`}
    </File>
  );
}
