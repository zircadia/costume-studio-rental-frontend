import React, { Component, Fragment } from 'react';
import Costume from '../../components/Costume/Costume/Costume';
import CostumeEdit from '../../components/Costume/CostumeEdit/CostumeEdit';
import Button from '../../components/Button/Button';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './costumes.css';

class Costumes extends Component {
  state = {
    isEditing: false,
    costumes: [],
    totalCostumes: 0,
    editCostume: null,
    costumePage: 1,
    costumesLoading: true,
    editLoading: false,
    isAuth: false,
    isAdmin: false
  };

  componentDidMount() {

    this.loadCostumes();
  }

  addCostume = costume => {
    this.setState(prevState => {
      const updatedCostumes = [...prevState.costumes];

        updatedCostumes.pop();
        updatedCostumes.unshift(costume);

      return {
        costumes: updatedCostumes,
        totalCostumes: prevState.totalCostumes +1
      };
    })
  }

  loadCostumes = direction => {
    if (direction) {
      this.setState({ costumesLoading: true, costumes: [] });
    }
    let page = this.state.costumePage;
    if (direction === 'next') {
      page++;
      this.setState({ costumePage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ costumePage: page });
    }
    fetch('https://costume-studio-rental.herokuapp.com/costumes?page=' + page, {
    })
    .then(res => {
      if (res.status !== 200) {
        throw new Error('Failed to fetch costumes.');
      }
      return res.json();
    })
    .then(resData => {
      console.log(this.props);
      if(this.props.isAuth) {
        this.setState({isAuth: true})
      }
      if(this.props.isAdmin) {
        this.setState({isAdmin: true})
      }
      this.setState({
        costumes: resData.costumes.map(costume => {
          return {...costume,
            imagePath: costume.imageUrl
          }
        }),
        totalCostumes: resData.totalItems,
        costumesLoading: false
      });
    })
    .catch(this.catchError);
  };

  newCostumeHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditCostumeHandler = costumeId => {
    this.setState(prevState => {
      const loadedCostume = { ...prevState.costumes.find(c => c._id === costumeId) };

      return {
        isEditing: true,
        editCostume: loadedCostume
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = costumeData => {
    this.setState({
      editLoading: true
    });
    const formData = new FormData();
    formData.append('category', costumeData.category);
    formData.append('costumeName', costumeData.costumeName);
    formData.append('size', costumeData.size);
    formData.append('rentalFee', costumeData.rentalFee);
    formData.append('description', costumeData.description);
    formData.append('imageUrl', costumeData.imageUrl);
    
    let url = 'https://costume-studio-rental.herokuapp.com/admin/add-costume';
    let method = 'POST';
    let body = JSON.stringify(Object.fromEntries(formData));
    
    if (this.state.editCostume) {
      url = 'https://costume-studio-rental.herokuapp.com/admin/edit-costume/';
      method = 'PUT';
      body = JSON.stringify({
        category: costumeData.category,
        costumeName: costumeData.costumeName,
        size: costumeData.size,
        rentalFee: costumeData.rentalFee,
        description: costumeData.description,
        imageUrl: costumeData.imageUrl,
        costumeId: this.state.editCostume._id
      })
    }

    fetch(url, {
      method: method,
      body: body, 
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      }
      
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a costume failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        const costume = {
          id: resData.costume._id,
          category: resData.costume.category,
          costumeName: resData.costume.costumeName,
          costumeFee: resData.costume.rentalFee,
          size: resData.costume.size,
          imageUrl: resData.costume.imageUrl,
          description: resData.costume.description,
          adminId: resData.costume.userId
        };
        this.setState(prevState => {
          const updatedCostumes = [...prevState.costumes];
            if (prevState.editCostume) {
              const costumeIndex = prevState.costumes.findIndex(
                c => c._id === prevState.editCostume._id
              );
              updatedCostumes[costumeIndex] = costume;
            }
          return {
            costumes: updatedCostumes,
            isEditing: false,
            editCostume: null,
            editLoading: false,
            costumesLoading: false
        }});
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editCostume: null,
          editLoading: false,
          error: err
        });
      });
  };

  deleteCostumeHandler = costumeId => {
    this.setState({ costumesLoading: true });
    fetch('https://costume-studio-rental.herokuapp.com/admin/delete-costume/' + costumeId, {
      method: "DELETE",
      headers: {
        Authorization: 'Bearer ' + this.props.token
      }
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a costume failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        this.setState(prevState => {
          const updatedCostumes = prevState.costumes.filter(c => c._id !== costumeId);
          return { costumes: updatedCostumes, costumesLoading: false };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({ costumesLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        
        {this.state.isAdmin ? 
        <div className='adminContent'>
            <CostumeEdit
                editing={this.state.isEditing}
                selectedCostume={this.state.editCostume}
                loading={this.state.editLoading}
                onCancelEdit={this.cancelEditHandler}
                onFinishEdit={this.finishEditHandler}
              />
            <section className="feed__control admin-button">
              <Button mode="raised" design="accent" onClick={this.newCostumeHandler}>
                New Costume
              </Button>
            </section>
          </div> : ''}
        <section className="feed costumes">
          {this.state.costumesLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {(!this.state.costumes) && !this.state.costumesLoading ? (
            <p style={{ textAlign: 'center' }}>No costumes found.</p>
          ) : null}
          {(this.state.costumes.length <= 0 ) && !this.state.costumesLoading ? (
            <p style={{ textAlign: 'center' }}>No costumes found.</p>
          ) : null}
          {!this.state.costumesLoading && (
            <div className="costumesContainer">
              {this.state.costumes.map(costume => (
                <Costume
                  key={costume._id + Math.random()}
                  id={costume._id}
                  admin={costume.userId}
                  costumeName={costume.costumeName}
                  size={costume.size}
                  category={costume.category}
                  rentalFee={costume.rentalFee}
                  imageUrl={costume.imageUrl}
                  description={costume.description}
                  isAuth={this.state.isAuth}
                  isAdmin={this.state.isAdmin}
                  onStartEdit={this.startEditCostumeHandler.bind(this, costume._id)}
                  onDelete={this.deleteCostumeHandler.bind(this, costume._id)}
                />
              ))}
            <Paginator
              onPrevious={this.loadCostumes.bind(this, 'previous')}
              onNext={this.loadCostumes.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalCostumes / 2)}
              currentPage={this.state.costumePage}
            ></Paginator>
            </div>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Costumes;
