// This file "operationController" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
)

//GetOperationList method:get operation list
func (bc *BaseController) GetOperationList() (error, []*dream.Operation) {

	result, err := dream.GetOperationList(bc.DB)
	if err != nil {
		return ServiceErr, nil
	}
	return nil, result
}

//AddOperation method : add a operation
func (bc *BaseController) AddOperation(operation *dream.Operation) (error, *dream.Operation) {

	result, err := dream.AddOperation(bc.DB, operation)

	if err != nil {
		return ServiceErr, nil
	}

	return nil, result
}

//GetOperationById method: get a operation by Id
func (bc *BaseController) GetOperationByID(uuid string) (*dream.Operation, error) {

	result, err := dream.GetOperationByUUID(bc.DB, uuid)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//UpateOperation method :update a operation by Id
func (bc *BaseController) UpateOperation(operation *dream.Operation) (*dream.Operation, error) {

	result, err := dream.UpdateOperation(bc.DB, operation)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//DeleteOperations method :delete operations by id array
func (bc *BaseController) DeleteOperations(ids []string) error {

	err := dream.DeleteOperationByIDs(bc.DB, ids)

	if err != nil {
		return ServiceErr
	}
	return nil
}
