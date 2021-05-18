import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PeerService } from 'src/app/peer.service';
import { WebSocketService } from 'src/app/web-socket.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  roomName:string;
  currentStream: any;
  listUser:Array<any> = [];

  constructor(
    private _route:ActivatedRoute,
    private _webSocketService:WebSocketService,
    private _peerService:PeerService
  ) {
    this.roomName = _route.snapshot.paramMap.get('id'); 
  }

  ngOnInit(): void {
    this.checkMediaDevices()
    this.initPeer();
    this.initSocket();
  }

  initPeer = () => {
    const peer = this._peerService.peer;
    peer.on('open', (id) => {
      const body = {
        idPeer: id,
        roomName: this.roomName
      };
      this._webSocketService.joinRoom(body);
    });

    peer.on('call', callEnter => {
      callEnter.answer(this.currentStream);
      callEnter.on('stream', (streamRemote) => {
        this.addVideoUser(streamRemote);
      });
    },err => {
      console.log('***ERROR*** Peer call ', err);
    });
  }

  initSocket = () => {
    this._webSocketService.cbEvent.subscribe(
      res =>{
        if(res.name === 'new-user'){
          const {idPeer} = res.data;
          
          this.sendCall(idPeer, this.currentStream);
        }
      }
    )
  }

  checkMediaDevices = () => {
    if(navigator && navigator.mediaDevices){
      navigator.mediaDevices.getUserMedia({
        audio:false,
        video:true
      }).then(stream =>{
        this.currentStream = stream;
        this.addVideoUser(stream);
      }).catch(() =>{
        console.log('*** ERROR *** Not permissions');
      });
    }else{
      console.log('*** ERROR *** Not media devices');
    }
  }


  addVideoUser = (stream: any) => {
    this.listUser.push(stream);
    const unique = new Set(this.listUser);
    this.listUser = [...unique];
  }

  sendCall = (idPeer, stream) => {
    const newUserCall =  this._peerService.peer.call(idPeer, stream);
    if(!!newUserCall){
      newUserCall.on('stream', (userStream: MediaStream) => {
        this.addVideoUser(userStream);
      });
    }
  }

}