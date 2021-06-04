import React, { Component } from 'react'
import {withAuthenticator} from 'aws-amplify-react'
import {API,graphqlOperation} from "aws-amplify"
import {createNote,deleteNote,updateNote} from './graphql/mutations'
import {listNotes} from './graphql/queries'
import { onCreateNote,onDeleteNote,onUpdateNote} from './graphql/subscriptions'
class App extends Component {
  state={
    id:'',
    note:'',
    notes:[]
  }
  hasExistingNote =()=>{
    const {notes,id}=this.state;
    if(id){
      const isNote = notes.findIndex(note => note.id === id) > -1
      return isNote
    }
    return false
  }
  handleChange = event => this.setState({note:event.target.value});
  handleAddQuote =async  event => {
    const {note}= this.state
    event.preventDefault();
    //her checking
    if(this.hasExistingNote()){
      this.handleUpdate()
    }
    else{
      const input = {note : note};
       await API.graphql(graphqlOperation(createNote,{input:input}));
      this.setState({note:''})
    }
  }
  handleUpdate = async ()=>{
    const {id,note} = this.state
    const input = {id,note};
    await API.graphql(graphqlOperation(updateNote,{input}))
  }
  // handleClick = item =>{
  //   this.setState({note:item.note,id:item.id})
  // }
  handleDelete =async noteId =>{
    const input = {id : noteId}
    await API.graphql(graphqlOperation(deleteNote,{input:input}))
  }
  componentWillUnmount(){
    this.createListener.unsubscribe();
    this.deleteListener.unsubscribe();
    this.updateListener.unsubscribe();

  }
   componentDidMount(){
    this.getNote();
    this.createListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({ next : nodeData =>{
      const newNote = nodeData.value.data.onCreateNote;
      const prev = this.state.notes.filter(note => note.id !== newNote.id)
      const updatedNote = [...prev,newNote];
      this.setState({notes:updatedNote})
    }
    })
    this.deleteListener = API.graphql(graphqlOperation(onDeleteNote)).subscribe({ next : noteData =>{
       const deleteNote = noteData.value.data.onDeleteNote;
      const updatedNotes = this.state.notes.filter(note => note.id !== deleteNote.id)
      this.setState({notes:updatedNotes})
    }})
    this.updateListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({ next : noteData =>{
      const updatedNote = noteData.value.data.onUpdateNote;
      const {notes} = this.state;
      const index = notes.findIndex(note => note.id === updatedNote.id)
      const updatedNotes = [
        ...notes.slice(0,index),
        updatedNote,
        ...notes.slice(index + 1)
      ]
      this.setState({notes:updatedNotes,note:'',id:''})
    }})
  }
  getNote = async () =>{
    const result = await API.graphql(graphqlOperation(listNotes));
     await this.setState({notes:result.data.listNotes.items})
  }
  render(){
    return (
      <div style={{display:'flex',
                   flexDirection:'column',
                   background:'black',
                   color:'white',
                   alignItems:'center',
                   justifyContent:'center',
                   padding:'30px',
                   fontFamily:'sans-serif'}}>
                     <h1 style={{marginBottom:0}}>AL</h1>
        <h1>Favourite Quote</h1>
        <form style={{marginBottom:'30px'}} onSubmit={this.handleAddQuote}>
          <input 
          style={{padding:'10px'}}
          placeholder="write your fav quote..."
          onChange={this.handleChange}
          value={this.state.note}/>
          <button type='submit' style={{padding:'10px'}}>{this.state.id ? "Update Quote" : "Add Quote"}</button>
        </form>
        <div>
          {this.state.notes.map(item =>(
            <div key={item.id} style={{display:'flex'}}>
              <li  style={{listStyleType:'none',fontFamily:'cursive',textTransform:'uppercase'}}
                  // onClick={()=>this.handleClick(item)}
                  
                  >{item.note}</li>
              <button disabled className='bg-transparent bn white f5'
                      onClick={()=>this.handleDelete(item.id)}>
                <span>&times;</span>
              </button>
            </div>
          ))}
  
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App, {includeGreetings:true});
