import { File, Text } from '@asyncapi/generator-react-sdk';
import { importModels } from '../../components/util';

function toPascalCase(name) {
    return name.replace(' ', '');
} 

function getChannelWrappers(asyncapi, params) {
    let channelWrappers = []; 
    let channelEntries = Object.keys(asyncapi.channels()).length ? Object.entries(asyncapi.channels()) : [];
    console.log(channelEntries);
    /*channelEntries.map(([channelName, channel]) => {
        
    });*/
}

function formatClassName(title) {
    return `${toPascalCase(title)}Client.java`;
}

export default function ({ asyncapi, params }) {
  const className = formatClassName(asyncapi.info().title());
  return (
    <File name={className}>
`
package asyncapi.nats.client;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.time.Duration;

${importModels().join('\n')};
import asyncapi.nats.models.*;

import io.nats.client.Connection;
import io.nats.client.Message;
import io.nats.client.Nats;
import io.nats.client.Subscription;

public class ${className}Client {
    
    private Connection connection;    

    public void connect() {
        connection = Nats.connect();
    }

    public void connect(String url) {
        connection = Nats.connect(url)
    }

    ${getChannelWrappers(asyncapi, params).join('\n')}

}
`
    </File>
  );
}
